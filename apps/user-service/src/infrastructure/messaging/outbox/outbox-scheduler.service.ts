import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OutboxEntity } from '../../persistence/entities/outbox.entity';
import { LoggerService } from '../../logger/logger.service';
import {
  OUTBOX_STATUS,
  BULL_QUEUE,
  BULL_JOB,
  OUTBOX_CONFIG,
} from '../../constants';
import { errorMessage } from '../../http/utils/error-message.util';

/**
 * OUTBOX Scheduler Service
 *
 * Polls outbox table for:
 * 1. Pending events that need to be published
 * 2. "Stuck" publishing events (timeout)
 *
 * This ensures all domain events are eventually published to Kafka.
 */
@Injectable()
export class OutboxSchedulerService {
  private isPolling = false;

  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
    @InjectQueue(BULL_QUEUE.OUTBOX_PUBLISHER)
    private readonly outboxQueue: Queue,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Poll for pending events every 5 seconds.
   * Skips overlapping ticks via the {@link isPolling} re-entrancy guard.
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async pollPendingEvents() {
    if (this.isPolling) return;
    this.isPolling = true;
    try {
      const events = await this.findPendingEvents();
      if (events.length > 0) {
        this.logger.debug(`Found ${events.length} pending outbox events`, {
          category: 'outbox',
          action: 'poll_pending',
          count: events.length,
        });
        await this.enqueueEvents(events);
      }
    } catch (error) {
      this.logger.error(`Outbox polling failed: ${errorMessage(error)}`, {
        category: 'outbox',
        action: 'poll_error',
        error: errorMessage(error),
      });
    } finally {
      this.isPolling = false;
    }
  }

  private findPendingEvents(): Promise<OutboxEntity[]> {
    const threshold = new Date(Date.now() - OUTBOX_CONFIG.STUCK_THRESHOLD_MS);
    return this.outboxRepository.find({
      where: {
        status: OUTBOX_STATUS.PENDING,
        createdAt: MoreThan(threshold),
      },
      take: OUTBOX_CONFIG.PENDING_BATCH_SIZE,
      order: { createdAt: 'ASC' },
    });
  }

  private async enqueueEvents(events: OutboxEntity[]): Promise<void> {
    for (const event of events) {
      await this.enqueueOne(event);
    }
  }

  private async enqueueOne(event: OutboxEntity): Promise<void> {
    try {
      await this.outboxQueue.add(
        BULL_JOB.PUBLISH_OUTBOX_EVENT,
        { eventId: event.eventId },
        {
          jobId: event.eventId,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    } catch (error) {
      const message = errorMessage(error);
      // Duplicate jobId is benign — job is already queued from a previous tick.
      if (message?.includes('job already exists')) return;
      this.logger.error(
        `Failed to queue outbox event ${event.eventId}: ${message}`,
        {
          category: 'outbox',
          action: 'queue_failed',
          eventId: event.eventId,
          error: message,
        },
      );
    }
  }

  /**
   * Poll for stuck "publishing" events every minute.
   * Events stuck in "publishing" for > threshold are reset to "pending"
   * so the next tick of {@link pollPendingEvents} re-queues them.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async pollStuckEvents() {
    try {
      const stuck = await this.findStuckEvents();
      if (stuck.length === 0) return;

      this.logger.warn(`Found ${stuck.length} stuck outbox events`, {
        category: 'outbox',
        action: 'poll_stuck',
        count: stuck.length,
      });
      await this.resetStuckEvents(stuck);
    } catch (error) {
      this.logger.error(
        `Failed to process stuck outbox events: ${errorMessage(error)}`,
        {
          category: 'outbox',
          action: 'stuck_error',
          error: errorMessage(error),
        },
      );
    }
  }

  private findStuckEvents(): Promise<OutboxEntity[]> {
    const threshold = new Date(Date.now() - OUTBOX_CONFIG.STUCK_THRESHOLD_MS);
    return this.outboxRepository.find({
      where: {
        status: OUTBOX_STATUS.PUBLISHING,
        createdAt: LessThan(threshold),
      },
      take: OUTBOX_CONFIG.STUCK_BATCH_SIZE,
    });
  }

  private async resetStuckEvents(events: OutboxEntity[]): Promise<void> {
    for (const event of events) {
      event.status = OUTBOX_STATUS.PENDING;
      event.retryCount += 1;
      await this.outboxRepository.save(event);
      this.logger.debug(
        `Reset stuck outbox event ${event.eventId} to pending`,
        {
          category: 'outbox',
          action: 'reset_stuck',
          eventId: event.eventId,
          retryCount: event.retryCount,
        },
      );
    }
  }

  /**
   * Cleanup old published events once per hour.
   * Keeps outbox table clean.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldEvents() {
    try {
      const retentionDate = new Date(
        Date.now() - OUTBOX_CONFIG.CLEANUP_RETENTION_MS,
      );

      const result = await this.outboxRepository
        .createQueryBuilder()
        .delete()
        .where('status = :status', { status: OUTBOX_STATUS.PUBLISHED })
        .andWhere('published_at < :date', { date: retentionDate })
        .execute();

      const deleted = result.affected || 0;

      if (deleted > 0) {
        this.logger.info(`Cleaned up ${deleted} old outbox events`, {
          category: 'outbox',
          action: 'cleanup',
          deletedCount: deleted,
        });
      }
    } catch (error) {
      this.logger.error(`Outbox cleanup failed: ${errorMessage(error)}`, {
        category: 'outbox',
        action: 'cleanup_error',
        error: errorMessage(error),
      });
    }
  }
}
