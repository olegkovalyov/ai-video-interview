import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from '@repo/shared';
import { LoggerModule } from '../logger/logger.module';

/**
 * Kafka Module
 * Handles Kafka integration for Interview Service
 * 
 * Producers: Domain events via OutboxService
 * Consumers: None (for now)
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
  ],
  providers: [
    {
      provide: 'KAFKA_CONFIG',
      useFactory: (configService: ConfigService) => ({
        clientId: configService.get('KAFKA_CLIENT_ID', 'interview-service'),
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
        return new KafkaService('interview-service');
      },
    },
  ],
  exports: ['KAFKA_SERVICE'],
})
export class KafkaModule {}
