import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AnalysisResultEntity } from './entities/analysis-result.entity';
import { QuestionAnalysisEntity } from './entities/question-analysis.entity';
import { ProcessedEventEntity } from './entities/processed-event.entity';
import { AnalysisResultMapper } from './mappers/analysis-result.mapper';

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
  ],
  exports: [
    TypeOrmModule,
    AnalysisResultMapper,
  ],
})
export class DatabaseModule {}
