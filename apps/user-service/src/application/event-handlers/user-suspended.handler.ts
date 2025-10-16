import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UserSuspendedEvent } from '../../domain/events/user-suspended.event';
import { UserEventProducer } from '../../infrastructure/kafka/producers/user-event.producer';

/**
 * User Suspended Event Handler
 * Publishes suspension events to Kafka
 */
@EventsHandler(UserSuspendedEvent)
export class UserSuspendedEventHandler implements IEventHandler<UserSuspendedEvent> {
  private readonly logger = new Logger(UserSuspendedEventHandler.name);

  constructor(private readonly kafkaProducer: UserEventProducer) {}

  async handle(event: UserSuspendedEvent) {
    this.logger.log(`Handling UserSuspendedEvent for user: ${event.userId}`);

    try {
      await this.kafkaProducer.publishEvent(event);
      this.logger.log(`✅ Published UserSuspendedEvent to Kafka: ${event.userId}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to publish UserSuspendedEvent: ${error.message}`,
        error.stack,
      );
    }
  }
}
