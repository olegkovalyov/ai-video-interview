import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UserUpdatedEvent } from '../../domain/events/user-updated.event';
import { UserEventProducer } from '../../infrastructure/kafka/producers/user-event.producer';

/**
 * User Updated Event Handler
 * Listens to domain event and publishes to Kafka
 */
@EventsHandler(UserUpdatedEvent)
export class UserUpdatedEventHandler implements IEventHandler<UserUpdatedEvent> {
  private readonly logger = new Logger(UserUpdatedEventHandler.name);

  constructor(private readonly kafkaProducer: UserEventProducer) {}

  async handle(event: UserUpdatedEvent) {
    this.logger.log(`Handling UserUpdatedEvent for user: ${event.userId}`);

    try {
      await this.kafkaProducer.publishEvent(event);
      this.logger.log(`✅ Published UserUpdatedEvent to Kafka: ${event.userId}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to publish UserUpdatedEvent: ${error.message}`,
        error.stack,
      );
    }
  }
}
