import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { OutboxEntity } from '../../persistence/entities/outbox.entity';

/**
 * OUTBOX Scheduler Service
 * 
 * Polls outbox table for:
 * 1. Pending events that need to be published
 * 2. "Stuck" publishing events (timeout)
 * 
 * This ensures all domain events are eventually published to Kafka
 */
@Injectable()
export class OutboxSchedulerService {
  private isPolling = false;

  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
    @InjectQueue('outbox-publisher') private readonly outboxQueue: Queue,
  ) {}

  /**
   * Poll for pending events every 5 seconds
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async pollPendingEvents() {
    if (this.isPolling) {
      console.log('⏭️  OUTBOX SCHEDULER: Already polling, skipping');
      return;
    }

    this.isPolling = true;

    try {
      // Find pending events (not older than 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const pendingEvents = await this.outboxRepository.find({
        where: {
          status: 'pending',
          createdAt: MoreThan(fiveMinutesAgo),
        },
        take: 100,
        order: {
          createdAt: 'ASC',
        },
      });

      if (pendingEvents.length > 0) {
        console.log(`🔍 OUTBOX SCHEDULER: Found ${pendingEvents.length} pending events`);

        for (const event of pendingEvents) {
          try {
            await this.outboxQueue.add(
              'publish-outbox-event',
              { eventId: event.eventId },
              {
                jobId: event.eventId,
                removeOnComplete: true,
                removeOnFail: false,
              },
            );

            console.log(`📤 OUTBOX SCHEDULER: Queued ${event.eventId}`);
          } catch (error) {
            // Job already exists - that's OK
            if (error.message?.includes('job already exists')) {
              continue;
            }
            console.error(`❌ OUTBOX SCHEDULER: Failed to queue ${event.eventId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ OUTBOX SCHEDULER: Polling failed:', error);
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Poll for stuck "publishing" events every minute
   * Events stuck in "publishing" for > 5 minutes will be retried
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async pollStuckEvents() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const stuckEvents = await this.outboxRepository.find({
        where: {
          status: 'publishing',
          createdAt: LessThan(fiveMinutesAgo), // publishing for > 5 minutes
        },
        take: 50,
      });

      if (stuckEvents.length > 0) {
        console.log(`⚠️  OUTBOX SCHEDULER: Found ${stuckEvents.length} stuck events`);

        for (const event of stuckEvents) {
          // Reset to pending for retry
          event.status = 'pending';
          event.retryCount += 1;
          await this.outboxRepository.save(event);

          console.log(`🔄 OUTBOX SCHEDULER: Reset stuck event ${event.eventId} to pending`);
        }
      }
    } catch (error) {
      console.error('❌ OUTBOX SCHEDULER: Failed to process stuck events:', error);
    }
  }

  /**
   * Cleanup old published events once per hour
   * Keeps outbox table clean
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldEvents() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await this.outboxRepository
        .createQueryBuilder()
        .delete()
        .where('status = :status', { status: 'published' })
        .andWhere('published_at < :date', { date: oneDayAgo })
        .execute();

      const deleted = result.affected || 0;

      if (deleted > 0) {
        console.log(`🧹 OUTBOX SCHEDULER: Cleaned up ${deleted} old events`);
      }
    } catch (error) {
      console.error('❌ OUTBOX SCHEDULER: Cleanup failed:', error);
    }
  }
}
