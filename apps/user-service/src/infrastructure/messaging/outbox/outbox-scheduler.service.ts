import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { OutboxEntity } from '../../persistence/entities/outbox.entity';
import { LoggerService } from '../../logger/logger.service';
import {
  OUTBOX_STATUS,
  BULL_QUEUE,
  BULL_JOB,
  OUTBOX_CONFIG,
} from '../../constants';

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
    @InjectQueue(BULL_QUEUE.OUTBOX_PUBLISHER) private readonly outboxQueue: Queue,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Poll for pending events every 5 seconds
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async pollPendingEvents() {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;

    try {
      const threshold = new Date(Date.now() - OUTBOX_CONFIG.STUCK_THRESHOLD_MS);

      const pendingEvents = await this.outboxRepository.find({
        where: {
          status: OUTBOX_STATUS.PENDING,
          createdAt: MoreThan(threshold),
        },
        take: OUTBOX_CONFIG.PENDING_BATCH_SIZE,
        order: {
          createdAt: 'ASC',
        },
      });

      if (pendingEvents.length > 0) {
        this.logger.debug(`Found ${pendingEvents.length} pending outbox events`, {
          category: 'outbox',
          action: 'poll_pending',
          count: pendingEvents.length,
        });

        for (const event of pendingEvents) {
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
            if (error.message?.includes('job already exists')) {
              continue;
            }
            this.logger.error(`Failed to queue outbox event ${event.eventId}: ${error.message}`, {
              category: 'outbox',
              action: 'queue_failed',
              eventId: event.eventId,
              error: error.message,
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(`Outbox polling failed: ${error.message}`, {
        category: 'outbox',
        action: 'poll_error',
        error: error.message,
      });
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Poll for stuck "publishing" events every minute.
   * Events stuck in "publishing" for > threshold will be retried.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async pollStuckEvents() {
    try {
      const threshold = new Date(Date.now() - OUTBOX_CONFIG.STUCK_THRESHOLD_MS);

      const stuckEvents = await this.outboxRepository.find({
        where: {
          status: OUTBOX_STATUS.PUBLISHING,
          createdAt: LessThan(threshold),
        },
        take: OUTBOX_CONFIG.STUCK_BATCH_SIZE,
      });

      if (stuckEvents.length > 0) {
        this.logger.warn(`Found ${stuckEvents.length} stuck outbox events`, {
          category: 'outbox',
          action: 'poll_stuck',
          count: stuckEvents.length,
        });

        for (const event of stuckEvents) {
          event.status = OUTBOX_STATUS.PENDING;
          event.retryCount += 1;
          await this.outboxRepository.save(event);

          this.logger.debug(`Reset stuck outbox event ${event.eventId} to pending`, {
            category: 'outbox',
            action: 'reset_stuck',
            eventId: event.eventId,
            retryCount: event.retryCount,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process stuck outbox events: ${error.message}`, {
        category: 'outbox',
        action: 'stuck_error',
        error: error.message,
      });
    }
  }

  /**
   * Cleanup old published events once per hour.
   * Keeps outbox table clean.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldEvents() {
    try {
      const retentionDate = new Date(Date.now() - OUTBOX_CONFIG.CLEANUP_RETENTION_MS);

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
      this.logger.error(`Outbox cleanup failed: ${error.message}`, {
        category: 'outbox',
        action: 'cleanup_error',
        error: error.message,
      });
    }
  }
}
