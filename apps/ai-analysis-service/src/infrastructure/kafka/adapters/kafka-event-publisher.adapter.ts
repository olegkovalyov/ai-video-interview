import { Injectable, Inject, Logger } from '@nestjs/common';
import { KafkaService, KAFKA_TOPICS } from '@repo/shared';
import {
  IEventPublisher,
  AnalysisEvent,
} from '../../../application/ports/event-publisher.port';
import { correlationStore } from '../../http/interceptors/correlation-id.store';

/**
 * Kafka adapter for IEventPublisher port.
 * Publishes domain events to the `analysis-events` Kafka topic.
 */
@Injectable()
export class KafkaEventPublisher implements IEventPublisher {
  private readonly logger = new Logger(KafkaEventPublisher.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
  ) {}

  async publish(event: AnalysisEvent): Promise<void> {
    const kafkaEvent = {
      eventId: event.eventId,
      eventType: event.eventType,
      timestamp: event.occurredAt.toISOString(),
      version: 1,
      payload: event.payload,
    };

    try {
      // Forward correlationId from the consumer context to the produced event
      const store = correlationStore.getStore();
      const headers = store?.correlationId
        ? { 'x-correlation-id': store.correlationId }
        : undefined;

      await this.kafkaService.publishEvent(
        KAFKA_TOPICS.ANALYSIS_EVENTS,
        kafkaEvent,
        headers,
        { partitionKey: event.aggregateId },
      );

      this.logger.debug(
        `Published ${event.eventType} for aggregate ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish ${event.eventType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
