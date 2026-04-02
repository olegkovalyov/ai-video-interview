import { Processor, Process } from "@nestjs/bull";
import type { Job } from "bull";
import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { KafkaService, KAFKA_TOPICS, injectTraceContext } from "@repo/shared";
import { OutboxEntity } from "../../persistence/entities/outbox.entity";
import {
  BULL_QUEUE,
  BULL_JOB,
  OUTBOX_STATUS,
  OUTBOX_CONFIG,
} from "../../constants";
import { LoggerService } from "../../logger/logger.service";

/**
 * OUTBOX Publisher Processor
 *
 * Publishes integration events from outbox to Kafka:
 * 1. Fetches event from outbox table
 * 2. Publishes to billing-events topic
 * 3. Updates outbox status
 *
 * ALL billing-service events go to KAFKA_TOPICS.BILLING_EVENTS.
 */
@Processor(BULL_QUEUE.OUTBOX_PUBLISHER)
@Injectable()
export class OutboxPublisherProcessor {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
    @Inject("KAFKA_SERVICE") private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
  ) {}

  @Process({
    name: BULL_JOB.PUBLISH_OUTBOX_EVENT,
    concurrency: OUTBOX_CONFIG.PUBLISHER_CONCURRENCY,
  })
  async publishOutboxEvent(job: Job) {
    const { eventId } = job.data;

    this.logger.info(`Publishing outbox event: ${eventId}`);

    const outbox = await this.outboxRepository.findOne({
      where: { eventId, status: OUTBOX_STATUS.PENDING },
    });

    if (!outbox) {
      this.logger.debug(`Event ${eventId} already published or not found`);
      return;
    }

    outbox.status = OUTBOX_STATUS.PUBLISHING;
    await this.outboxRepository.save(outbox);

    try {
      await this.kafkaService.publishEvent(
        KAFKA_TOPICS.BILLING_EVENTS,
        outbox.payload,
        injectTraceContext(),
        { partitionKey: outbox.aggregateId },
      );

      outbox.status = OUTBOX_STATUS.PUBLISHED;
      outbox.publishedAt = new Date();
      await this.outboxRepository.save(outbox);

      this.logger.info(
        `Published ${eventId} (${outbox.eventType}) to ${KAFKA_TOPICS.BILLING_EVENTS}`,
      );
    } catch (error) {
      outbox.status = OUTBOX_STATUS.FAILED;
      outbox.errorMessage = error.message;
      outbox.retryCount += 1;
      await this.outboxRepository.save(outbox);

      this.logger.error(
        `Failed to publish ${eventId}: ${error.message}`,
        error.stack,
      );

      if (outbox.retryCount < OUTBOX_CONFIG.RETRY_ATTEMPTS) {
        throw error;
      }

      this.logger.warn(
        `Max retries reached for ${eventId}, event marked as failed`,
      );
    }
  }
}
