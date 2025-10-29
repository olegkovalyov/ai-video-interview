import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { OutboxEntity } from '../../persistence/entities/outbox.entity';

/**
 * OUTBOX Service
 * 
 * Saves domain events to outbox table and schedules publishing
 * This ensures at-least-once delivery guarantee
 */
@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
    @InjectQueue('outbox-publisher') private readonly outboxQueue: Queue,
  ) {}

  /**
   * Save event to OUTBOX table and schedule for publishing
   */
  async saveEvent(eventType: string, payload: any, aggregateId: string): Promise<void> {
    const eventId = this.generateEventId();

    // 1. Save to outbox table
    const outbox = this.outboxRepository.create({
      eventId,
      aggregateId,
      eventType,
      payload,
      status: 'pending',
      retryCount: 0,
    });

    await this.outboxRepository.save(outbox);
    console.log(`📦 OUTBOX: Saved event ${eventId} (${eventType})`);

    // 2. Add to BullMQ queue for publishing
    await this.outboxQueue.add(
      'publish-outbox-event',
      { eventId },
      {
        jobId: eventId, // Prevent duplicate jobs
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    console.log(`📤 OUTBOX: Queued job for ${eventId}`);
  }

  /**
   * Save multiple events in batch (transactional)
   */
  async saveEvents(events: Array<{ eventType: string; payload: any; aggregateId: string }>): Promise<void> {
    if (events.length === 0) return;

    const outboxEntries = events.map((event) => {
      const eventId = this.generateEventId();
      return this.outboxRepository.create({
        eventId,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payload: event.payload,
        status: 'pending',
        retryCount: 0,
      });
    });

    await this.outboxRepository.save(outboxEntries);
    console.log(`📦 OUTBOX: Saved ${events.length} events (batch)`);

    // Schedule publishing
    const jobs = outboxEntries.map((outbox) => ({
      name: 'publish-outbox-event',
      data: { eventId: outbox.eventId },
      opts: {
        jobId: outbox.eventId,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }));

    await this.outboxQueue.addBulk(jobs);
    console.log(`📤 OUTBOX: Queued ${jobs.length} jobs (batch)`);
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
