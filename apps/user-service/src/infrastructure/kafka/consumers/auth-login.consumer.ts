import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { KafkaService, KAFKA_TOPICS } from '@repo/shared';
import type { KafkaMessage } from 'kafkajs';
import { LoggerService } from '../../logger/logger.service';
import { correlationStore } from '../../http/interceptors/correlation-id.store';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../persistence/entities/user.entity';

/**
 * Subset of the user.authenticated event schema this consumer cares about.
 * Produced by the auth gateway; kept narrow on purpose — everything else is ignored.
 */
interface UserAuthenticatedEvent {
  eventType: 'user.authenticated';
  payload?: {
    externalAuthId?: string;
    email?: string;
  };
}

function isUserAuthenticatedEvent(
  value: unknown,
): value is UserAuthenticatedEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'eventType' in value &&
    (value as { eventType?: unknown }).eventType === 'user.authenticated'
  );
}

/**
 * Consumer for auth-events to update last_login_at
 * Simple, non-critical operation - no INBOX/OUTBOX needed
 */
@Injectable()
export class AuthLoginConsumer implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    // Fire-and-forget: the Kafka subscription is long-running; awaiting it here
    // would block NestJS `app.listen()`. Errors inside the subscription are
    // handled per-message below.
    void this.kafkaService.subscribe(
      KAFKA_TOPICS.AUTH_EVENTS,
      'user-service-auth-login-consumer',
      (message) => this.handleMessage(message),
    );

    this.logger.log('AuthLoginConsumer: Subscribed to auth-events');
  }

  private async handleMessage(message: KafkaMessage): Promise<void> {
    const correlationId =
      message.headers?.['x-correlation-id']?.toString() || 'unknown';

    await correlationStore.run({ correlationId }, async () => {
      try {
        if (!message.value) {
          this.logger.warn('Received message with null value', {
            topic: KAFKA_TOPICS.AUTH_EVENTS,
          });
          return;
        }

        const event: unknown = JSON.parse(message.value.toString());

        // Only handle user.authenticated events
        if (isUserAuthenticatedEvent(event)) {
          await this.handleUserAuthenticated(event);
        }
      } catch (error) {
        this.logger.error('Failed to process auth event', {
          error: error instanceof Error ? error.message : String(error),
          topic: KAFKA_TOPICS.AUTH_EVENTS,
        });
      }
    });
  }

  private async handleUserAuthenticated(
    event: UserAuthenticatedEvent,
  ): Promise<void> {
    const externalAuthId = event.payload?.externalAuthId;
    if (!externalAuthId) {
      this.logger.warn(
        'Missing externalAuthId in user.authenticated event payload',
        { event },
      );
      return;
    }

    try {
      await this.touchLastLogin(externalAuthId, event);
    } catch (error) {
      // Non-critical: failing to update last_login_at must not crash the consumer.
      this.logger.error('Failed to update last_login_at', {
        error: error instanceof Error ? error.message : String(error),
        externalAuthId,
      });
    }
  }

  private async touchLastLogin(
    externalAuthId: string,
    event: UserAuthenticatedEvent,
  ): Promise<void> {
    const result = await this.userRepository.update(
      { externalAuthId },
      { lastLoginAt: new Date() },
    );
    if (result.affected && result.affected > 0) {
      this.logger.debug('Updated last_login_at', {
        externalAuthId,
        email: event.payload?.email,
        eventType: event.eventType,
      });
    } else {
      this.logger.warn('User not found for last_login update', {
        externalAuthId,
        email: event.payload?.email,
      });
    }
  }
}
