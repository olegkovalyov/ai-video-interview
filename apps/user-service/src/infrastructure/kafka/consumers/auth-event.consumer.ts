import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Kafka, Consumer, EachBatchPayload } from 'kafkajs';
import { EventIdempotencyService } from '../services/event-idempotency.service';
import { CreateUserCommand } from '../../../application/commands/create-user/create-user.command';
import { LoggerService } from '../../logger/logger.service';

interface AuthEvent {
  eventType: string;
  eventId: string;
  timestamp: string;
  data: any;
}

/**
 * Kafka Consumer for Auth Events
 * Consumes events from auth-events topic (from API Gateway)
 * Uses manual offset commits and idempotency checking
 */
@Injectable()
export class AuthEventConsumer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;
  private readonly topic = 'auth-events';
  private readonly groupId = 'user-service-auth-events';
  private readonly dlqTopic = 'auth-events-dlq';

  constructor(
    @Inject('KAFKA_CONFIG')
    private readonly kafkaConfig: any,
    private readonly commandBus: CommandBus,
    private readonly idempotencyService: EventIdempotencyService,
    private readonly logger: LoggerService,
  ) {
    this.kafka = new Kafka(this.kafkaConfig);
    this.consumer = this.kafka.consumer({
      groupId: this.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
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
        const event: AuthEvent = JSON.parse(message.value.toString());

        // Check idempotency
        const { processed } = await this.idempotencyService.processOnce(
          event.eventId,
          event.eventType,
          async () => {
            await this.handleEvent(event);
          },
          event.data,
        );

        if (processed) {
          this.logger.kafkaLog('consume', this.topic, true, {
            component: 'AuthEventConsumer',
            eventType: event.eventType,
            eventId: event.eventId,
            action: 'event_processed',
          });
        } else {
          this.logger.debug('Skipped duplicate event', {
            category: 'kafka',
            component: 'AuthEventConsumer',
            eventType: event.eventType,
            eventId: event.eventId,
          });
        }

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
  private async handleEvent(event: AuthEvent): Promise<void> {
    switch (event.eventType) {
      case 'user_authenticated':
        await this.handleUserAuthenticated(event);
        break;

      case 'user_logged_in':
        await this.handleUserLoggedIn(event);
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
   * Handle user_authenticated event
   * Create user if doesn't exist (first login)
   */
  private async handleUserAuthenticated(event: AuthEvent): Promise<void> {
    const { keycloakId, email, firstName, lastName } = event.data;

    try {
      const command = new CreateUserCommand(
        keycloakId,
        email,
        firstName,
        lastName,
      );

      await this.commandBus.execute(command);
      
      this.logger.info('User created from auth event', {
        category: 'kafka',
        component: 'AuthEventConsumer',
        email,
        keycloakId,
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
   * Handle user_logged_in event
   * Update last_login_at timestamp
   */
  private async handleUserLoggedIn(event: AuthEvent): Promise<void> {
    const { userId, timestamp } = event.data;
    
    // TODO: Implement UpdateLastLoginCommand or direct repository update
    this.logger.debug('User logged in event received', {
      category: 'kafka',
      component: 'AuthEventConsumer',
      userId,
      timestamp,
    });
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
