import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { UserEventProducer } from './producers/user-event.producer';
import { AuthEventConsumer } from './consumers/auth-event.consumer';
import { EventIdempotencyService } from './services/event-idempotency.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedEventEntity } from '../persistence/entities/processed-event.entity';

@Module({
  imports: [
    ConfigModule,
    CqrsModule, // Provides CommandBus for AuthEventConsumer
    TypeOrmModule.forFeature([ProcessedEventEntity]),
  ],
  providers: [
    UserEventProducer,
    AuthEventConsumer,
    EventIdempotencyService,
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
  ],
  exports: [UserEventProducer, AuthEventConsumer, EventIdempotencyService],
})
export class KafkaModule {}
