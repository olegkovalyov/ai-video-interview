import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { ProcessedEvent } from '../entities/processed-event.entity';

@Injectable()
export class EventIdempotencyService {
  constructor(
    @InjectRepository(ProcessedEvent)
    private readonly processedEventRepository: Repository<ProcessedEvent>,
  ) {}

  /**
   * Check if event was already processed by this service
   */
  async isEventProcessed(eventId: string, serviceName: string): Promise<boolean> {
    try {
      const existingEvent = await this.processedEventRepository.findOne({
        where: { eventId, serviceName }
      });
      return !!existingEvent;
    } catch (error) {
      console.error('❌ Error checking event idempotency:', error);
      // In case of DB error, assume not processed to avoid losing events
      return false;
    }
  }

  /**
   * Mark event as processed by this service
   */
  async markEventProcessed(
    eventId: string, 
    eventType: string, 
    serviceName: string, 
    payload?: any
  ): Promise<void> {
    const payloadHash = payload ? createHash('sha256').update(JSON.stringify(payload)).digest('hex') : null;
    
    try {
      const processedEvent = new ProcessedEvent();
      processedEvent.eventId = eventId;
      processedEvent.eventType = eventType;
      processedEvent.serviceName = serviceName;
      processedEvent.payloadHash = payloadHash || undefined;
      
      await this.processedEventRepository.save(processedEvent);
      console.log(`✅ Event marked as processed: ${eventId} (${eventType}) by ${serviceName}`);
    } catch (error) {
      // Check if it's a duplicate key error (constraint violation)
      if (error.code === '23505') {
        console.log(`⚡ Event already processed: ${eventId} (${eventType}) by ${serviceName}`);
        return;
      }
      console.error('❌ Error marking event as processed:', error);
      throw error;
    }
  }

  /**
   * Process event with idempotency check
   */
  async processEventSafely<T>(
    eventId: string,
    eventType: string,
    serviceName: string,
    payload: T,
    handler: (payload: T) => Promise<void>
  ): Promise<void> {
    // Check if already processed
    if (await this.isEventProcessed(eventId, serviceName)) {
      console.log(`⚡ Event already processed, skipping: ${eventId} (${eventType}) by ${serviceName}`);
      return;
    }

    // Process the event
    await handler(payload);

    // Mark as processed only after successful processing
    await this.markEventProcessed(eventId, eventType, serviceName, payload);
  }

  /**
   * Cleanup old processed events (retention policy)
   */
  async cleanupOldEvents(retentionDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.processedEventRepository
        .createQueryBuilder()
        .delete()
        .from(ProcessedEvent)
        .where('processed_at < :cutoffDate', { cutoffDate })
        .execute();

      const deletedCount = result.affected || 0;
      console.log(`🧹 Cleaned up ${deletedCount} old processed events (older than ${retentionDays} days)`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old events:', error);
      throw error;
    }
  }
}
