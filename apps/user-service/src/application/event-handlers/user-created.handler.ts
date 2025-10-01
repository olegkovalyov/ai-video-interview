import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UserCreatedEvent } from '../../domain/events/user-created.event';
import { UserEventProducer } from '../../infrastructure/kafka/producers/user-event.producer';

/**
 * User Created Event Handler
 * Listens to domain event and publishes to Kafka
 */
@EventsHandler(UserCreatedEvent)
export class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
  private readonly logger = new Logger(UserCreatedEventHandler.name);

  constructor(private readonly kafkaProducer: UserEventProducer) {}

  async handle(event: UserCreatedEvent) {
    this.logger.log(`Handling UserCreatedEvent for user: ${event.userId}`);

    try {
      await this.kafkaProducer.publishEvent(event);
      this.logger.log(`✅ Published UserCreatedEvent to Kafka: ${event.userId}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to publish UserCreatedEvent: ${error.message}`,
        error.stack,
      );
      // Don't throw - we don't want to fail the command
    }
  }
}
