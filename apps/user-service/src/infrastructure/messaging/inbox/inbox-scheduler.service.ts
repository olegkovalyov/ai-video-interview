import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { InboxEntity } from '../../persistence/entities/inbox.entity';

/**
 * INBOX Scheduler Service
 * 
 * Fallback mechanism that polls inbox table for:
 * 1. Pending messages that haven't been queued
 * 2. "Stuck" processing messages (timeout)
 * 
 * This ensures no messages are lost even if BullMQ fails
 */
@Injectable()
export class InboxSchedulerService {
  private isPolling = false;

  constructor(
    @InjectRepository(InboxEntity)
    private readonly inboxRepository: Repository<InboxEntity>,
    @InjectQueue('inbox-processor') private readonly inboxQueue: Queue,
  ) {}

  /**
   * Poll for pending messages every 10 seconds
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async pollPendingMessages() {
    if (this.isPolling) {
      console.log('⏭️  INBOX SCHEDULER: Already polling, skipping');
      return;
    }

    this.isPolling = true;

    try {
      // Find pending messages (not older than 5 minutes to avoid reprocessing old failed messages)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const pendingMessages = await this.inboxRepository.find({
        where: {
          status: 'pending',
          createdAt: LessThan(new Date()), // any pending message
        },
        take: 100,
        order: {
          createdAt: 'ASC',
        },
      });

      if (pendingMessages.length > 0) {
        console.log(`🔍 INBOX SCHEDULER: Found ${pendingMessages.length} pending messages`);

        for (const message of pendingMessages) {
          try {
            await this.inboxQueue.add(
              'process-inbox-message',
              { messageId: message.messageId },
              {
                jobId: message.messageId,
                removeOnComplete: true,
                removeOnFail: false,
              },
            );

            console.log(`📤 INBOX SCHEDULER: Queued ${message.messageId}`);
          } catch (error) {
            // Job already exists - that's OK
            if (error.message?.includes('job already exists')) {
              continue;
            }
            console.error(`❌ INBOX SCHEDULER: Failed to queue ${message.messageId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ INBOX SCHEDULER: Polling failed:', error);
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Poll for stuck "processing" messages every minute
   * Messages stuck in "processing" for > 5 minutes will be retried
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async pollStuckMessages() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const stuckMessages = await this.inboxRepository.find({
        where: {
          status: 'processing',
          createdAt: LessThan(fiveMinutesAgo), // processing for > 5 minutes
        },
        take: 50,
      });

      if (stuckMessages.length > 0) {
        console.log(`⚠️  INBOX SCHEDULER: Found ${stuckMessages.length} stuck messages`);

        for (const message of stuckMessages) {
          // Reset to pending for retry
          message.status = 'pending';
          message.retryCount += 1;
          await this.inboxRepository.save(message);

          console.log(`🔄 INBOX SCHEDULER: Reset stuck message ${message.messageId} to pending`);
        }
      }
    } catch (error) {
      console.error('❌ INBOX SCHEDULER: Failed to process stuck messages:', error);
    }
  }

  /**
   * Cleanup old processed messages once per hour
   * Keeps inbox table clean
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldMessages() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await this.inboxRepository
        .createQueryBuilder()
        .delete()
        .where('status = :status', { status: 'processed' })
        .andWhere('processed_at < :date', { date: oneDayAgo })
        .execute();

      const deleted = result.affected || 0;

      if (deleted > 0) {
        console.log(`🧹 INBOX SCHEDULER: Cleaned up ${deleted} old messages`);
      }
    } catch (error) {
      console.error('❌ INBOX SCHEDULER: Cleanup failed:', error);
    }
  }
}
