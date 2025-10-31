import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaService, KAFKA_TOPICS, injectTraceContext } from '@repo/shared';
import { OutboxEntity } from '../../persistence/entities/outbox.entity';

/**
 * OUTBOX Publisher Processor
 * 
 * Publishes integration events from outbox to user-events topic:
 * 1. Fetches event from outbox table
 * 2. Publishes to user-events Kafka topic with trace context
 * 3. Updates outbox status
 * 
 * Integration events (source='user-service'):
 * - user.created, user.updated, user.deleted
 * - user.suspended, user.activated  
 * - user.role_assigned, user.role_removed
 * 
 * Consumed by: Interview Service, Notification Service, Analytics
 * 
 * Runs with concurrency for parallel publishing
 */
@Processor('outbox-publisher')
@Injectable()
export class OutboxPublisherProcessor {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
  ) {}

  @Process({
    name: 'publish-outbox-event',
    concurrency: 2, // Publish 2 events in parallel
  })
  async publishOutboxEvent(job: Job) {
    const { eventId } = job.data;

    console.log(`📤 OUTBOX PUBLISHER: Publishing ${eventId}`);

    // 1. Fetch from outbox table
    const outbox = await this.outboxRepository.findOne({
      where: { eventId, status: 'pending' },
    });

    if (!outbox) {
      console.log(`⏭️  OUTBOX PUBLISHER: Event ${eventId} already published or not found`);
      return;
    }

    // 2. Mark as publishing
    outbox.status = 'publishing';
    await this.outboxRepository.save(outbox);

    try {
      // 3. Publish to user-events topic with trace context
      await this.kafkaService.publishEvent(
        KAFKA_TOPICS.USER_EVENTS,
        outbox.payload,
        injectTraceContext(), // Propagate distributed trace
      );

      // 4. Mark as published
      outbox.status = 'published';
      outbox.publishedAt = new Date();
      await this.outboxRepository.save(outbox);

      console.log(`✅ OUTBOX PUBLISHER: Successfully published ${eventId} (${outbox.eventType}) to user-events`);
    } catch (error) {
      // 5. Handle failure
      outbox.status = 'failed';
      outbox.errorMessage = error.message;
      outbox.retryCount += 1;
      await this.outboxRepository.save(outbox);

      console.error(`❌ OUTBOX PUBLISHER: Failed to publish ${eventId}:`, error);

      // Re-throw if haven't exceeded retry limit
      if (outbox.retryCount < 3) {
        throw error; // BullMQ will retry
      }

      console.log(`💀 OUTBOX PUBLISHER: Max retries reached for ${eventId}`);
    }
  }
}
