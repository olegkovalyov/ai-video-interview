import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaService } from '@repo/shared';
import { InvitationCompletedConsumer } from './consumers/invitation-completed.consumer';
import { LlmModule } from '../llm/llm.module';
import { AnalysisResultEntity } from '../persistence/entities/analysis-result.entity';
import { QuestionAnalysisEntity } from '../persistence/entities/question-analysis.entity';
import { ProcessedEventEntity } from '../persistence/entities/processed-event.entity';

@Module({
  imports: [
    ConfigModule,
    LlmModule,
    TypeOrmModule.forFeature([AnalysisResultEntity, QuestionAnalysisEntity, ProcessedEventEntity]),
  ],
  providers: [
    InvitationCompletedConsumer,
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
  exports: ['KAFKA_SERVICE'],
})
export class KafkaModule {}
