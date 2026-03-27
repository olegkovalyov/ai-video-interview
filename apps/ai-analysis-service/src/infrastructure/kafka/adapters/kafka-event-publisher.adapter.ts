import { Injectable, Logger } from "@nestjs/common";
import {
  IEventPublisher,
  AnalysisEvent,
} from "../../../application/ports/event-publisher.port";
import { OutboxService } from "../../messaging/outbox/outbox.service";

/**
 * Outbox-backed adapter for IEventPublisher port.
 *
 * Instead of publishing directly to Kafka, this adapter saves events
 * to the outbox table via OutboxService. BullMQ workers then pick up
 * the events and publish them to the `analysis-events` Kafka topic.
 *
 * This ensures at-least-once delivery guarantee for all analysis events.
 */
@Injectable()
export class KafkaEventPublisher implements IEventPublisher {
  private readonly logger = new Logger(KafkaEventPublisher.name);

  constructor(private readonly outboxService: OutboxService) {}

  async publish(event: AnalysisEvent): Promise<void> {
    try {
      const eventId = await this.outboxService.saveEvent(
        event.eventType,
        {
          ...event.payload,
          eventId: event.eventId,
          occurredAt: event.occurredAt.toISOString(),
        },
        event.aggregateId,
      );

      this.logger.debug(
        `Saved ${event.eventType} for aggregate ${event.aggregateId} to outbox (eventId: ${eventId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to save ${event.eventType} to outbox: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }
}
