import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { KafkaService, KAFKA_TOPICS } from '@repo/shared';
import { LoggerService } from '../../logger/logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../persistence/entities/user.entity';

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

  async onModuleInit() {
    await this.kafkaService.subscribe(
      KAFKA_TOPICS.AUTH_EVENTS,
      'user-service-auth-login-consumer',
      async (message) => {
        try {
          if (!message.value) {
            this.logger.warn('Received message with null value', {
              topic: KAFKA_TOPICS.AUTH_EVENTS,
            });
            return;
          }

          const event = JSON.parse(message.value.toString());

          // Only handle user.authenticated events
          if (event.eventType === 'user.authenticated') {
            await this.handleUserAuthenticated(event);
          }
        } catch (error) {
          this.logger.error('Failed to process auth event', {
            error: error.message,
            topic: KAFKA_TOPICS.AUTH_EVENTS,
          });
        }
      },
    );

    this.logger.log('AuthLoginConsumer: Subscribed to auth-events');
  }

  private async handleUserAuthenticated(event: any): Promise<void> {
    const externalAuthId = event.payload?.externalAuthId;

    if (!externalAuthId) {
      this.logger.warn('Missing externalAuthId in user.authenticated event payload', {
        event,
      });
      return;
    }

    try {
      // Update last_login_at
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
    } catch (error: any) {
      this.logger.error('Failed to update last_login_at', {
        error: error.message,
        externalAuthId,
      });
      // Don't throw - это не критичная операция
    }
  }
}
