import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedEventEntity } from '../../persistence/entities/processed-event.entity';

/**
 * Event Idempotency Service
 * Prevents duplicate event processing using processed_events table
 * Based on Kafka integration architecture from memory
 */
@Injectable()
export class EventIdempotencyService {
  private readonly logger = new Logger(EventIdempotencyService.name);
  private readonly serviceName = 'user-service';

  constructor(
    @InjectRepository(ProcessedEventEntity)
    private readonly repository: Repository<ProcessedEventEntity>,
  ) {}

  /**
   * Check if event has already been processed
   */
  async isProcessed(eventId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        eventId,
        serviceName: this.serviceName,
      },
    });

    return count > 0;
  }

  /**
   * Mark event as processed (idempotent)
   * Returns false if event was already processed
   */
  async markAsProcessed(
    eventId: string,
    eventType: string,
    payload?: any,
  ): Promise<boolean> {
    try {
      const entity = this.repository.create({
        eventId,
        serviceName: this.serviceName,
        eventType,
        payload,
        processedAt: new Date(),
      });

      await this.repository.save(entity);
      
      this.logger.debug(`✅ Event ${eventId} marked as processed`);
      return true;
    } catch (error) {
      // Unique constraint violation = already processed
      if (error.code === '23505') {
        this.logger.debug(`⚠️ Event ${eventId} already processed (duplicate)`);
        return false;
      }
      throw error;
    }
  }

  /**
   * Process event with idempotency guarantee
   * Returns true if event was processed, false if already processed
   */
  async processOnce<T>(
    eventId: string,
    eventType: string,
    handler: () => Promise<T>,
    payload?: any,
  ): Promise<{ processed: boolean; result?: T }> {
    // Check if already processed
    const alreadyProcessed = await this.isProcessed(eventId);
    
    if (alreadyProcessed) {
      this.logger.debug(`⏭️ Skipping duplicate event ${eventId}`);
      return { processed: false };
    }

    // Execute handler
    const result = await handler();

    // Mark as processed
    await this.markAsProcessed(eventId, eventType, payload);

    return { processed: true, result };
  }

  /**
   * Cleanup old processed events (maintenance job)
   */
  async cleanupOldEvents(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('processed_at < :cutoffDate', { cutoffDate })
      .execute();

    const deleted = result.affected || 0;
    this.logger.log(`🧹 Cleaned up ${deleted} old events (older than ${olderThanDays} days)`);
    
    return deleted;
  }
}
