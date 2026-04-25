import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaService, KAFKA_TOPICS, injectTraceContext } from '@repo/shared';
import { OutboxEntity } from '../../persistence/entities/outbox.entity';
import { LoggerService } from '../../logger/logger.service';
import { OUTBOX_STATUS, BULL_QUEUE, OUTBOX_CONFIG } from '../../constants';
import { errorMessage } from '../../http/utils/error-message.util';

/**
 * OUTBOX Publisher Processor (BullMQ Worker)
 *
 * Publishes integration events from outbox to user-events Kafka topic:
 * 1. Fetches event from outbox table
 * 2. Publishes to Kafka with trace context
 * 3. Updates outbox status
 */
@Processor(BULL_QUEUE.OUTBOX_PUBLISHER, {
  concurrency: OUTBOX_CONFIG.PUBLISHER_CONCURRENCY,
})
export class OutboxPublisherProcessor extends WorkerHost {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  async process(job: Job<{ eventId: string }>): Promise<void> {
    const { eventId } = job.data;

    const outbox = await this.outboxRepository.findOne({
      where: { eventId, status: OUTBOX_STATUS.PENDING },
    });
    if (!outbox) {
      this.logger.debug(
        `Outbox event ${eventId} already published or not found`,
        { category: 'outbox', action: 'skip', eventId },
      );
      return;
    }

    outbox.status = OUTBOX_STATUS.PUBLISHING;
    await this.outboxRepository.save(outbox);

    try {
      await this.publishAndMarkSent(outbox);
    } catch (error) {
      const shouldRetry = await this.handlePublishFailure(outbox, error);
      if (shouldRetry) throw error;
    }
  }

  private async publishAndMarkSent(outbox: OutboxEntity): Promise<void> {
    await this.kafkaService.publishEvent(
      KAFKA_TOPICS.USER_EVENTS,
      outbox.payload,
      injectTraceContext(),
    );
    outbox.status = OUTBOX_STATUS.PUBLISHED;
    outbox.publishedAt = new Date();
    await this.outboxRepository.save(outbox);

    this.logger.debug(
      `Outbox event published: ${outbox.eventId} (${outbox.eventType})`,
      {
        category: 'outbox',
        action: 'published',
        eventId: outbox.eventId,
        eventType: outbox.eventType,
      },
    );
  }

  /**
   * Persist failure metadata and decide whether the caller should re-throw.
   * Re-throwing causes BullMQ to retry under its exponential-backoff policy.
   * Returning `false` once we hit RETRY_ATTEMPTS preserves the legacy
   * "max retries → swallow" behaviour from before this refactor.
   */
  private async handlePublishFailure(
    outbox: OutboxEntity,
    error: unknown,
  ): Promise<boolean> {
    const message = errorMessage(error);
    outbox.status = OUTBOX_STATUS.FAILED;
    outbox.errorMessage = message;
    outbox.retryCount += 1;
    await this.outboxRepository.save(outbox);

    this.logger.error(
      `Failed to publish outbox event ${outbox.eventId}: ${message}`,
      {
        category: 'outbox',
        action: 'publish_failed',
        eventId: outbox.eventId,
        retryCount: outbox.retryCount,
        error: message,
      },
    );

    if (outbox.retryCount >= OUTBOX_CONFIG.RETRY_ATTEMPTS) {
      this.logger.error(
        `Max retries reached for outbox event ${outbox.eventId}`,
        {
          category: 'outbox',
          action: 'max_retries',
          eventId: outbox.eventId,
        },
      );
      return false;
    }
    return true;
  }
}
