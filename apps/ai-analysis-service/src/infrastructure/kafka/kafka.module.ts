import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaService } from '@repo/shared';
import { InvitationCompletedConsumer } from './consumers/invitation-completed.consumer';
import { KafkaEventPublisher } from './adapters/kafka-event-publisher.adapter';
import { EVENT_PUBLISHER } from '../../application/ports/event-publisher.port';
import { AnalysisResultEntity } from '../persistence/entities/analysis-result.entity';
import { ProcessedEventEntity } from '../persistence/entities/processed-event.entity';

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    TypeOrmModule.forFeature([AnalysisResultEntity, ProcessedEventEntity]),
  ],
  providers: [
    InvitationCompletedConsumer,
    {
      provide: EVENT_PUBLISHER,
      useClass: KafkaEventPublisher,
    },
    {
      provide: 'KAFKA_CONFIG',
      useFactory: (configService: ConfigService) => ({
        clientId: configService.get('KAFKA_CLIENT_ID', 'ai-analysis-service'),
        brokers: configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
      }),
      inject: [ConfigService],
    },
    {
      provide: 'KAFKA_SERVICE',
      useFactory: (configService: ConfigService) => {
        const brokers = configService.get('KAFKA_BROKERS', 'localhost:9092').split(',');
        return new KafkaService('ai-analysis-service', brokers);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['KAFKA_SERVICE', EVENT_PUBLISHER],
})
export class KafkaModule {}
