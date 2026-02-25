import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaService, KAFKA_TOPICS, injectTraceContext } from '@repo/shared';
import { OutboxEntity } from '../../persistence/entities/outbox.entity';
import {
  BULL_QUEUE,
  BULL_JOB,
  OUTBOX_STATUS,
  OUTBOX_CONFIG,
} from '../../constants';
import { LoggerService } from '../../logger/logger.service';

/**
 * OUTBOX Publisher Processor
 *
 * Publishes integration events from outbox to Kafka:
 * 1. Fetches event from outbox table
 * 2. Publishes to interview-events topic
 * 3. Updates outbox status
 *
 * ALL interview-service events go to KAFKA_TOPICS.INTERVIEW_EVENTS.
 */
@Processor(BULL_QUEUE.OUTBOX_PUBLISHER)
@Injectable()
export class OutboxPublisherProcessor {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
  ) {}

  @Process({
    name: BULL_JOB.PUBLISH_OUTBOX_EVENT,
    concurrency: OUTBOX_CONFIG.PUBLISHER_CONCURRENCY,
  })
  async publishOutboxEvent(job: Job) {
    const { eventId } = job.data;

    this.logger.info(`Publishing outbox event: ${eventId}`);

    // 1. Fetch from outbox table
    const outbox = await this.outboxRepository.findOne({
      where: { eventId, status: OUTBOX_STATUS.PENDING },
    });

    if (!outbox) {
      this.logger.debug(`Event ${eventId} already published or not found`);
      return;
    }

    // 2. Mark as publishing
    outbox.status = OUTBOX_STATUS.PUBLISHING;
    await this.outboxRepository.save(outbox);

    try {
      // 3. Publish to Kafka — ALL interview-service events go to interview-events
      await this.kafkaService.publishEvent(
        KAFKA_TOPICS.INTERVIEW_EVENTS,
        outbox.payload,
        injectTraceContext(),
        { partitionKey: outbox.aggregateId },
      );

      // 4. Mark as published
      outbox.status = OUTBOX_STATUS.PUBLISHED;
      outbox.publishedAt = new Date();
      await this.outboxRepository.save(outbox);

      this.logger.info(
        `Published ${eventId} (${outbox.eventType}) to ${KAFKA_TOPICS.INTERVIEW_EVENTS}`,
      );
    } catch (error) {
      // 5. Handle failure
      outbox.status = OUTBOX_STATUS.FAILED;
      outbox.errorMessage = error.message;
      outbox.retryCount += 1;
      await this.outboxRepository.save(outbox);

      this.logger.error(`Failed to publish ${eventId}: ${error.message}`, error.stack);

      if (outbox.retryCount < OUTBOX_CONFIG.RETRY_ATTEMPTS) {
        throw error; // Bull will retry
      }

      this.logger.warn(`Max retries reached for ${eventId}, event marked as failed`);
    }
  }
}
