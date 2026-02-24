import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaService, KAFKA_TOPICS, injectTraceContext } from '@repo/shared';
import { OutboxEntity } from '../../persistence/entities/outbox.entity';
import { LoggerService } from '../../logger/logger.service';
import {
  OUTBOX_STATUS,
  BULL_QUEUE,
  BULL_JOB,
  OUTBOX_CONFIG,
} from '../../constants';

/**
 * OUTBOX Publisher Processor
 *
 * Publishes integration events from outbox to user-events Kafka topic:
 * 1. Fetches event from outbox table
 * 2. Publishes to Kafka with trace context
 * 3. Updates outbox status
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

    // 1. Fetch from outbox table
    const outbox = await this.outboxRepository.findOne({
      where: { eventId, status: OUTBOX_STATUS.PENDING },
    });

    if (!outbox) {
      this.logger.debug(`Outbox event ${eventId} already published or not found`, {
        category: 'outbox',
        action: 'skip',
        eventId,
      });
      return;
    }

    // 2. Mark as publishing
    outbox.status = OUTBOX_STATUS.PUBLISHING;
    await this.outboxRepository.save(outbox);

    try {
      // 3. Publish to user-events topic with trace context
      await this.kafkaService.publishEvent(
        KAFKA_TOPICS.USER_EVENTS,
        outbox.payload,
        injectTraceContext(),
      );

      // 4. Mark as published
      outbox.status = OUTBOX_STATUS.PUBLISHED;
      outbox.publishedAt = new Date();
      await this.outboxRepository.save(outbox);

      this.logger.debug(`Outbox event published: ${eventId} (${outbox.eventType})`, {
        category: 'outbox',
        action: 'published',
        eventId,
        eventType: outbox.eventType,
      });
    } catch (error) {
      // 5. Handle failure
      outbox.status = OUTBOX_STATUS.FAILED;
      outbox.errorMessage = error.message;
      outbox.retryCount += 1;
      await this.outboxRepository.save(outbox);

      this.logger.error(`Failed to publish outbox event ${eventId}: ${error.message}`, {
        category: 'outbox',
        action: 'publish_failed',
        eventId,
        retryCount: outbox.retryCount,
        error: error.message,
      });

      // Re-throw if haven't exceeded retry limit
      if (outbox.retryCount < OUTBOX_CONFIG.RETRY_ATTEMPTS) {
        throw error;
      }

      this.logger.error(`Max retries reached for outbox event ${eventId}`, {
        category: 'outbox',
        action: 'max_retries',
        eventId,
      });
    }
  }
}
