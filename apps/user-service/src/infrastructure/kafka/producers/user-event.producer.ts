import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import { UserCreatedEvent } from '../../../domain/events/user-created.event';
import { UserUpdatedEvent } from '../../../domain/events/user-updated.event';
import { UserSuspendedEvent } from '../../../domain/events/user-suspended.event';
import { UserDeletedEvent } from '../../../domain/events/user-deleted.event';
import { RoleAssignedEvent } from '../../../domain/events/role-assigned.event';
import { RoleRemovedEvent } from '../../../domain/events/role-removed.event';

type DomainEvent =
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserSuspendedEvent
  | UserDeletedEvent
  | RoleAssignedEvent
  | RoleRemovedEvent;

import { LoggerService } from '../../logger/logger.service';

/**
 * Kafka Producer for User Domain Events
 * Publishes domain events to user-events topic
 */
@Injectable()
export class UserEventProducer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private readonly topic = 'user-events';

  constructor(
    @Inject('KAFKA_CONFIG')
    private readonly kafkaConfig: any,
    private readonly logger: LoggerService,
  ) {
    this.kafka = new Kafka(this.kafkaConfig);
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.kafkaLog('connect', this.topic, true, {
        component: 'UserEventProducer',
        action: 'producer_connected',
      });
    } catch (error) {
      this.logger.kafkaLog('connect', this.topic, false, {
        component: 'UserEventProducer',
        error: error.message,
      });
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.logger.info('Kafka Producer disconnected', {
      category: 'kafka',
      component: 'UserEventProducer',
      action: 'producer_disconnected',
    });
  }

  /**
   * Publish domain event to Kafka
   * Uses userId as partition key for ordering guarantee
   */
  async publishEvent(event: DomainEvent): Promise<void> {
    try {
      const eventType = this.getEventType(event);
      const userId = this.getUserId(event);

      const message = {
        eventType,
        eventId: this.generateEventId(),
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: this.mapEventToData(event),
      };

      const record: ProducerRecord = {
        topic: this.topic,
        messages: [
          {
            key: userId, // Partition by userId for ordering
            value: JSON.stringify(message),
            headers: {
              eventType,
              userId,
              timestamp: message.timestamp,
            },
          },
        ],
      };

      await this.producer.send(record);

      this.logger.kafkaLog('publish', this.topic, true, {
        eventType,
        eventId: message.eventId,
        userId,
        component: 'UserEventProducer',
      });
    } catch (error) {
      this.logger.kafkaLog('publish', this.topic, false, {
        eventType: this.getEventType(event),
        userId: this.getUserId(event),
        component: 'UserEventProducer',
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Publish multiple events in batch (atomic)
   */
  async publishEvents(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return;

    try {
      const messages = events.map((event) => {
        const eventType = this.getEventType(event);
        const userId = this.getUserId(event);

        return {
          key: userId,
          value: JSON.stringify({
            eventType,
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: this.mapEventToData(event),
          }),
          headers: {
            eventType,
            userId,
          },
        };
      });

      await this.producer.send({
        topic: this.topic,
        messages,
      });

      this.logger.kafkaLog('publish_batch', this.topic, true, {
        component: 'UserEventProducer',
        batchSize: events.length,
        eventTypes: events.map(e => this.getEventType(e)),
      });
    } catch (error) {
      this.logger.kafkaLog('publish_batch', this.topic, false, {
        component: 'UserEventProducer',
        batchSize: events.length,
        error: error.message,
      });
      throw error;
    }
  }

  private getEventType(event: DomainEvent): string {
    if (event instanceof UserCreatedEvent) return 'user.created';
    if (event instanceof UserUpdatedEvent) return 'user.updated';
    if (event instanceof UserSuspendedEvent) return 'user.suspended';
    if (event instanceof UserDeletedEvent) return 'user.deleted';
    if (event instanceof RoleAssignedEvent) return 'user.role_assigned';
    if (event instanceof RoleRemovedEvent) return 'user.role_removed';
    return 'unknown';
  }

  private getUserId(event: DomainEvent): string {
    return event.userId;
  }

  private mapEventToData(event: DomainEvent): any {
    if (event instanceof UserCreatedEvent) {
      return {
        userId: event.userId,
        email: event.email,
        keycloakId: event.keycloakId,
        firstName: event.firstName,
        lastName: event.lastName,
        createdAt: new Date().toISOString(),
      };
    }

    if (event instanceof UserUpdatedEvent) {
      return {
        userId: event.userId,
        changes: event.changes,
        updatedAt: new Date().toISOString(),
      };
    }

    if (event instanceof UserSuspendedEvent) {
      return {
        userId: event.userId,
        reason: event.reason,
        suspendedBy: event.suspendedBy,
        suspendedAt: new Date().toISOString(),
      };
    }

    if (event instanceof UserDeletedEvent) {
      return {
        userId: event.userId,
        deletedBy: event.deletedBy,
        deletedAt: new Date().toISOString(),
      };
    }

    if (event instanceof RoleAssignedEvent) {
      return {
        userId: event.userId,
        roleId: event.roleId,
        roleName: event.roleName,
        assignedBy: event.assignedBy,
        assignedAt: new Date().toISOString(),
      };
    }

    if (event instanceof RoleRemovedEvent) {
      return {
        userId: event.userId,
        roleId: event.roleId,
        roleName: event.roleName,
        removedBy: event.removedBy,
        removedAt: new Date().toISOString(),
      };
    }

    return event;
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
