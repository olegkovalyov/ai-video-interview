import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Kafka, Consumer, EachBatchPayload } from 'kafkajs';
import { CreateUserCommand } from '../../../application/commands/create-user/create-user.command';
import { LoggerService } from '../../logger/logger.service';
import { UserAuthenticatedEvent } from '@repo/shared';
import { v4 as uuid } from 'uuid';

// Base event structure from @repo/shared
interface BaseKafkaEvent {
  eventId: string;
  eventType: string;
  timestamp: number;
  version: string;
  source: string;
  payload: any;
}

/**
 * Kafka Consumer for Auth Events
 * Consumes events from auth-events topic (from API Gateway)
 * Uses manual offset commits and idempotency checking
 * Handles user.authenticated events to create users on first login
 */
@Injectable()
export class AuthEventConsumer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;
  private readonly topic = 'auth-events'; // From @repo/shared KAFKA_TOPICS.AUTH_EVENTS
  private readonly groupId = 'user-service-auth-events';
  private readonly dlqTopic = 'auth-events-dlq';

  constructor(
    @Inject('KAFKA_CONFIG')
    private readonly kafkaConfig: any,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggerService,
  ) {
    // Настройка Kafka с кастомным логгером (убираем verbose логи)
    this.kafka = new Kafka({
      ...this.kafkaConfig,
      logLevel: 1, // ERROR only (0=NOTHING, 1=ERROR, 2=WARN, 4=INFO, 5=DEBUG)
    });
    this.consumer = this.kafka.consumer({
      groupId: this.groupId,
      sessionTimeout: 30000,       // 30s (default)
      heartbeatInterval: 3000,     // 3s (default)
      rebalanceTimeout: 60000,     // 60s
      maxWaitTimeInMs: 5000,       // 5s
      allowAutoTopicCreation: false,
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topic: this.topic,
        fromBeginning: false, // Production-ready: only new messages
      });

      // Start consuming with manual offset commits (eachBatch mode)
      await this.consumer.run({
        autoCommit: false, // Manual commits for exactly-once processing
        eachBatch: async (payload: EachBatchPayload) => {
          await this.handleBatch(payload);
        },
      });

      this.logger.kafkaLog('subscribe', this.topic, true, {
        component: 'AuthEventConsumer',
        groupId: this.groupId,
        action: 'consumer_connected',
      });
    } catch (error) {
      this.logger.kafkaLog('subscribe', this.topic, false, {
        component: 'AuthEventConsumer',
        error: error.message,
      });
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
    this.logger.info('Kafka Consumer disconnected', {
      category: 'kafka',
      component: 'AuthEventConsumer',
      action: 'consumer_disconnected',
    });
  }

  /**
   * Handle batch of messages with manual offset commits
   */
  private async handleBatch(payload: EachBatchPayload): Promise<void> {
    const { batch, resolveOffset, heartbeat, commitOffsetsIfNecessary } = payload;

    for (const message of batch.messages) {
      try {
        if (!message.value) continue;

        // Parse event
        const event: BaseKafkaEvent = JSON.parse(message.value.toString());

        // Process event (idempotency handled by CommandHandler)
        await this.handleEvent(event);

        this.logger.kafkaLog('consume', this.topic, true, {
          component: 'AuthEventConsumer',
          eventType: event.eventType,
          eventId: event.eventId,
          action: 'event_processed',
        });

        // Resolve offset after successful processing
        resolveOffset(message.offset);

        // Heartbeat to keep session alive
        await heartbeat();
      } catch (error) {
        this.logger.kafkaLog('consume', this.topic, false, {
          component: 'AuthEventConsumer',
          error: error.message,
          offset: message.offset,
        });

        // Send to DLQ
        await this.sendToDLQ(message, error);

        // Still resolve offset to not block processing
        resolveOffset(message.offset);
      }
    }

    // Commit offsets after batch is processed
    await commitOffsetsIfNecessary();
    this.logger.debug('Batch processed and committed', {
      category: 'kafka',
      component: 'AuthEventConsumer',
      batchSize: batch.messages.length,
      partition: batch.partition,
    });
  }

  /**
   * Handle individual auth event
   */
  private async handleEvent(event: BaseKafkaEvent): Promise<void> {
    switch (event.eventType) {
      case 'user.authenticated':
        await this.handleUserAuthenticated(event as UserAuthenticatedEvent);
        break;

      case 'user.logged_out':
        // TODO: Handle logout event if needed
        this.logger.debug('User logged out event received', {
          category: 'kafka',
          component: 'AuthEventConsumer',
          eventType: event.eventType,
          eventId: event.eventId,
        });
        break;

      default:
        this.logger.warn('Unknown event type received', {
          category: 'kafka',
          component: 'AuthEventConsumer',
          eventType: event.eventType,
          eventId: event.eventId,
        });
    }
  }

  /**
   * Handle user.authenticated event
   * Create user if doesn't exist (first login)
   */
  private async handleUserAuthenticated(event: UserAuthenticatedEvent): Promise<void> {
    // Note: event.payload.userId from auth-events is external auth provider ID
    const { userId: externalAuthId, email, firstName, lastName } = event.payload;

    try {
      // Generate internal userId for User Service
      const userId = uuid();

      const command = new CreateUserCommand(
        userId,           // Internal userId (primary key)
        externalAuthId,   // External auth provider ID
        email,
        firstName || 'Unknown',
        lastName || 'User',
      );

      await this.commandBus.execute(command);

      this.logger.info('User created from auth event', {
        category: 'kafka',
        component: 'AuthEventConsumer',
        userId,
        externalAuthId,
        email,
        firstName,
        lastName,
      });
    } catch (error) {
      // If user already exists, it's ok (idempotent)
      if (error.message?.includes('already exists')) {
        this.logger.debug('User already exists (idempotent)', {
          category: 'kafka',
          component: 'AuthEventConsumer',
          email,
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Send failed message to Dead Letter Queue
   */
  private async sendToDLQ(message: any, error: Error): Promise<void> {
    try {
      const producer = this.kafka.producer();
      await producer.connect();

      await producer.send({
        topic: this.dlqTopic,
        messages: [
          {
            key: message.key,
            value: message.value,
            headers: {
              ...message.headers,
              error: error.message,
              failedAt: new Date().toISOString(),
              originalTopic: this.topic,
            },
          },
        ],
      });

      await producer.disconnect();

      this.logger.warn('Message sent to DLQ', {
        category: 'kafka',
        component: 'AuthEventConsumer',
        dlqTopic: this.dlqTopic,
        error: error.message,
      });
    } catch (dlqError) {
      this.logger.error('Failed to send message to DLQ', dlqError, {
        category: 'kafka',
        component: 'AuthEventConsumer',
        dlqTopic: this.dlqTopic,
      });
    }
  }
}
