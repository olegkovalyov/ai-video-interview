import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { v4 as uuid } from 'uuid';
import { OutboxEntity } from '../../persistence/entities/outbox.entity';
import type { IOutboxService } from '../../../application/interfaces/outbox-service.interface';
import type { ITransactionContext } from '../../../application/interfaces/transaction-context.interface';
import { LoggerService } from '../../logger/logger.service';
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
 *
 * Transaction-aware: when `tx` is provided, the outbox entry is saved
 * within the same database transaction as the aggregate (no BullMQ job created).
 * Call `schedulePublishing()` after UnitOfWork commit to create BullMQ jobs.
 */
@Injectable()
export class OutboxService implements IOutboxService {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
    @InjectQueue(BULL_QUEUE.OUTBOX_PUBLISHER) private readonly outboxQueue: Queue,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Save event to OUTBOX table.
   * - With tx: saves in the same transaction, returns eventId (no BullMQ job).
   * - Without tx: saves directly and immediately creates BullMQ job.
   */
  async saveEvent(
    eventType: string,
    payload: Record<string, unknown>,
    aggregateId: string,
    tx?: ITransactionContext,
  ): Promise<string> {
    const eventId = this.generateEventId();
    const outbox = this.buildOutboxEntity(eventId, eventType, payload, aggregateId);

    if (tx) {
      // Save within the existing UnitOfWork transaction
      await (tx as unknown as EntityManager).save(OutboxEntity, outbox);
    } else {
      // Direct save + immediate BullMQ job (backward compatible)
      await this.outboxRepository.save(outbox);
      await this.addPublishJob(eventId);
    }

    this.logger.log(`Outbox event saved: ${eventId} (${eventType})`, {
      action: 'outbox.save',
      aggregateId,
      eventType,
    } as any);

    return eventId;
  }

  /**
   * Save multiple events in batch.
   * - With tx: saves in the same transaction, returns eventIds (no BullMQ jobs).
   * - Without tx: saves directly and immediately creates BullMQ jobs.
   */
  async saveEvents(
    events: Array<{ eventType: string; payload: Record<string, unknown>; aggregateId: string }>,
    tx?: ITransactionContext,
  ): Promise<string[]> {
    if (events.length === 0) return [];

    const outboxEntries = events.map((event) => {
      const eventId = this.generateEventId();
      return this.buildOutboxEntity(eventId, event.eventType, event.payload, event.aggregateId);
    });

    if (tx) {
      await (tx as unknown as EntityManager).save(OutboxEntity, outboxEntries);
    } else {
      await this.outboxRepository.save(outboxEntries);
      await this.addPublishJobs(outboxEntries.map((e) => e.eventId));
    }

    this.logger.log(`Outbox batch saved: ${outboxEntries.length} events`, {
      action: 'outbox.saveBatch',
      count: outboxEntries.length,
    } as any);

    return outboxEntries.map((e) => e.eventId);
  }

  /**
   * Schedule BullMQ jobs for outbox events saved within a transaction.
   * Call this AFTER UnitOfWork.execute() commits successfully.
   */
  async schedulePublishing(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;

    if (eventIds.length === 1) {
      await this.addPublishJob(eventIds[0]);
    } else {
      await this.addPublishJobs(eventIds);
    }

    this.logger.log(`Scheduled ${eventIds.length} outbox events for publishing`, {
      action: 'outbox.schedule',
      count: eventIds.length,
    } as any);
  }

  private buildOutboxEntity(
    eventId: string,
    eventType: string,
    payload: Record<string, unknown>,
    aggregateId: string,
  ): OutboxEntity {
    const envelope: Record<string, unknown> = {
      eventId,
      eventType,
      timestamp: Date.now(),
      version: SERVICE_VERSION,
      source: SERVICE_NAME,
      payload,
    };

    return this.outboxRepository.create({
      eventId,
      aggregateId,
      eventType,
      payload: envelope,
      status: OUTBOX_STATUS.PENDING,
      retryCount: 0,
    });
  }

  private async addPublishJob(eventId: string): Promise<void> {
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

  private async addPublishJobs(eventIds: string[]): Promise<void> {
    const jobs = eventIds.map((eventId) => ({
      name: BULL_JOB.PUBLISH_OUTBOX_EVENT,
      data: { eventId },
      opts: {
        jobId: eventId,
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
