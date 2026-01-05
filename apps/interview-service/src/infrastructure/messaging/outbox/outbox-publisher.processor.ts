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
 * Publishes integration events from outbox to appropriate Kafka topics:
 * 1. Fetches event from outbox table
 * 2. Determines target topic based on event type
 * 3. Publishes to Kafka with trace context
 * 4. Updates outbox status
 * 
 * Topic routing:
 * - invitation.* events → interview-events (consumed by AI Analysis Service)
 * - user.* events → user-events (consumed by other services)
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

    // 3. Determine target topic based on event type
    const topic = this.getTopicForEventType(outbox.eventType);

    try {
      // 4. Publish to Kafka with trace context and partition key
      await this.kafkaService.publishEvent(
        topic,
        outbox.payload,
        injectTraceContext(),
        { partitionKey: outbox.aggregateId },
      );

      // 5. Mark as published
      outbox.status = 'published';
      outbox.publishedAt = new Date();
      await this.outboxRepository.save(outbox);

      console.log(`✅ OUTBOX PUBLISHER: Successfully published ${eventId} (${outbox.eventType}) to ${topic}`);
    } catch (error) {
      // 6. Handle failure
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

  private getTopicForEventType(eventType: string): string {
    // Interview domain events go to interview-events topic
    if (eventType.startsWith('invitation.')) {
      return KAFKA_TOPICS.INTERVIEW_EVENTS;
    }
    // Default to user-events for other events
    return KAFKA_TOPICS.USER_EVENTS;
  }
}
