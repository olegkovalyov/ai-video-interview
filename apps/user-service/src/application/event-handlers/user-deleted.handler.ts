import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UserDeletedEvent } from '../../domain/events/user-deleted.event';
import { UserEventProducer } from '../../infrastructure/kafka/producers/user-event.producer';

/**
 * User Deleted Event Handler
 * Publishes deletion events to Kafka
 */
@EventsHandler(UserDeletedEvent)
export class UserDeletedEventHandler implements IEventHandler<UserDeletedEvent> {
  private readonly logger = new Logger(UserDeletedEventHandler.name);

  constructor(private readonly kafkaProducer: UserEventProducer) {}

  async handle(event: UserDeletedEvent) {
    this.logger.log(`Handling UserDeletedEvent for user: ${event.userId}`);

    try {
      await this.kafkaProducer.publishEvent(event);
      this.logger.log(`✅ Published UserDeletedEvent to Kafka: ${event.userId}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to publish UserDeletedEvent: ${error.message}`,
        error.stack,
      );
    }
  }
}
