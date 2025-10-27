import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { UserEventProducer } from './producers/user-event.producer';
import { AuthEventConsumer } from './consumers/auth-event.consumer';
import { KafkaService } from '@repo/shared';

@Module({
  imports: [
    ConfigModule,
    CqrsModule, // Provides CommandBus for AuthEventConsumer
  ],
  providers: [
    UserEventProducer,
    AuthEventConsumer,
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
  exports: [UserEventProducer, AuthEventConsumer, 'KAFKA_SERVICE'],
})
export class KafkaModule {}
