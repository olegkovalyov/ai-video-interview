import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaService } from '@repo/shared';
import { LoggerModule } from '../logger/logger.module';
import { AnalysisCompletedConsumer } from './consumers/analysis-completed.consumer';
import { InvitationEntity } from '../persistence/entities/invitation.entity';

/**
 * Kafka Module
 * Handles Kafka integration for Interview Service
 * 
 * Producers: Domain events via OutboxService
 * Consumers: analysis-events (from AI Analysis Service)
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    TypeOrmModule.forFeature([InvitationEntity]),
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
    AnalysisCompletedConsumer,
  ],
  exports: ['KAFKA_SERVICE'],
})
export class KafkaModule {}
