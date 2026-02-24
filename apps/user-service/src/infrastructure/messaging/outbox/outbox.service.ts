import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { v4 as uuid } from 'uuid';
import { OutboxEntity } from '../../persistence/entities/outbox.entity';
import type { IOutboxService } from '../../../application/ports/outbox-service.port';
import {
  OUTBOX_STATUS,
  BULL_QUEUE,
  BULL_JOB,
  OUTBOX_CONFIG,
  SERVICE_NAME,
  SERVICE_VERSION,
} from '../../constants';

/**
 * OUTBOX Service
 *
 * Saves domain events to outbox table and schedules publishing.
 * This ensures at-least-once delivery guarantee.
 */
@Injectable()
export class OutboxService implements IOutboxService {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
    @InjectQueue(BULL_QUEUE.OUTBOX_PUBLISHER) private readonly outboxQueue: Queue,
  ) {}

  /**
   * Save event to OUTBOX table and schedule for publishing.
   * Builds the Kafka envelope internally — callers pass only business payload.
   */
  async saveEvent(eventType: string, payload: Record<string, unknown>, aggregateId: string): Promise<void> {
    const eventId = this.generateEventId();

    // Build standard Kafka envelope
    const envelope: Record<string, unknown> = {
      eventId,
      eventType,
      timestamp: Date.now(),
      version: SERVICE_VERSION,
      source: SERVICE_NAME,
      payload,
    };

    // 1. Save to outbox table
    const outbox = this.outboxRepository.create({
      eventId,
      aggregateId,
      eventType,
      payload: envelope,
      status: OUTBOX_STATUS.PENDING,
      retryCount: 0,
    });

    await this.outboxRepository.save(outbox);

    // 2. Add to BullMQ queue for publishing
    await this.outboxQueue.add(
      BULL_JOB.PUBLISH_OUTBOX_EVENT,
      { eventId },
      {
        jobId: eventId,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: OUTBOX_CONFIG.RETRY_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: OUTBOX_CONFIG.BACKOFF_DELAY_MS,
        },
      },
    );
  }

  /**
   * Save multiple events in batch (transactional)
   */
  async saveEvents(events: Array<{ eventType: string; payload: Record<string, unknown>; aggregateId: string }>): Promise<void> {
    if (events.length === 0) return;

    const outboxEntries = events.map((event) => {
      const eventId = this.generateEventId();
      const envelope: Record<string, unknown> = {
        eventId,
        eventType: event.eventType,
        timestamp: Date.now(),
        version: SERVICE_VERSION,
        source: SERVICE_NAME,
        payload: event.payload,
      };
      return this.outboxRepository.create({
        eventId,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payload: envelope,
        status: OUTBOX_STATUS.PENDING,
        retryCount: 0,
      });
    });

    await this.outboxRepository.save(outboxEntries);

    // Schedule publishing
    const jobs = outboxEntries.map((outbox) => ({
      name: BULL_JOB.PUBLISH_OUTBOX_EVENT,
      data: { eventId: outbox.eventId },
      opts: {
        jobId: outbox.eventId,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: OUTBOX_CONFIG.RETRY_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: OUTBOX_CONFIG.BACKOFF_DELAY_MS,
        },
      },
    }));

    await this.outboxQueue.addBulk(jobs);
  }

  private generateEventId(): string {
    return uuid();
  }
}
