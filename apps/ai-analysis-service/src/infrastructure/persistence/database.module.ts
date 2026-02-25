import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AnalysisResultEntity } from './entities/analysis-result.entity';
import { QuestionAnalysisEntity } from './entities/question-analysis.entity';
import { ProcessedEventEntity } from './entities/processed-event.entity';
import { AnalysisResultMapper } from './mappers/analysis-result.mapper';
import { AnalysisResultPersistenceMapper } from './mappers/analysis-result-persistence.mapper';
import { TypeOrmAnalysisResultRepository } from './repositories/typeorm-analysis-result.repository';
import { ANALYSIS_RESULT_REPOSITORY } from '../../domain/repositories/analysis-result.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: parseInt(configService.get('DATABASE_PORT', '5432'), 10),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'ai_video_interview_analysis'),
        entities: [
          AnalysisResultEntity,
          QuestionAnalysisEntity,
          ProcessedEventEntity,
        ],
        synchronize: false,
        logging: configService.get('DATABASE_LOGGING', 'false') === 'true',
        ssl: configService.get('DATABASE_SSL', 'false') === 'true'
          ? { rejectUnauthorized: false }
          : false,
        extra: {
          max: parseInt(configService.get('DATABASE_POOL_MAX', '20'), 10),
          min: parseInt(configService.get('DATABASE_POOL_MIN', '2'), 10),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          statement_timeout: '30000',
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      AnalysisResultEntity,
      QuestionAnalysisEntity,
      ProcessedEventEntity,
    ]),
  ],
  providers: [
    AnalysisResultMapper,
    AnalysisResultPersistenceMapper,
    {
      provide: ANALYSIS_RESULT_REPOSITORY,
      useClass: TypeOrmAnalysisResultRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    AnalysisResultMapper,
    AnalysisResultPersistenceMapper,
    ANALYSIS_RESULT_REPOSITORY,
  ],
})
export class DatabaseModule {}
