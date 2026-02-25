import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthLoginConsumer } from './consumers/auth-login.consumer';
import { UserEntity } from '../persistence/entities/user.entity';
import { KafkaService } from '@repo/shared';
import { LoggerModule } from '../logger/logger.module';

/**
 * Kafka Module
 * Handles Kafka integration for User Service
 *
 * Publishing: Domain events via OutboxService + OutboxPublisherProcessor
 * Consumers: Auth events for last_login_at updates
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UserEntity]),
    LoggerModule,
  ],
  providers: [
    AuthLoginConsumer,
    {
      provide: 'KAFKA_CONFIG',
      useFactory: (configService: ConfigService) => ({
        clientId: configService.get('KAFKA_CLIENT_ID', 'user-service'),
        brokers: configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
        ssl: configService.get('KAFKA_SSL', 'false') === 'true',
        sasl: configService.get('KAFKA_SASL_ENABLED', 'false') === 'true'
          ? {
              mechanism: 'plain',
              username: configService.get('KAFKA_SASL_USERNAME'),
              password: configService.get('KAFKA_SASL_PASSWORD'),
            }
          : undefined,
      }),
      inject: [ConfigService],
    },
    {
      provide: 'KAFKA_SERVICE',
      useFactory: () => {
        return new KafkaService('user-service');
      },
    },
  ],
  exports: ['KAFKA_SERVICE'],
})
export class KafkaModule {}
