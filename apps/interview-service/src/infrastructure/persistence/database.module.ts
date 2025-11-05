import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OutboxEntity } from './entities/outbox.entity';
import { InterviewTemplateEntity } from './entities/interview-template.entity';
import { QuestionEntity } from './entities/question.entity';
import { TypeOrmInterviewTemplateRepository } from './repositories/typeorm-interview-template.repository';
import { InterviewTemplateReadRepository } from './repositories/interview-template-read.repository';

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
        database: configService.get('DATABASE_NAME', 'ai_video_interview_interview'),
        entities: [OutboxEntity, InterviewTemplateEntity, QuestionEntity],
        synchronize: false, // Always use migrations
        logging: false, // Disable SQL logging (too verbose)
        ssl: configService.get('DATABASE_SSL', 'false') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      OutboxEntity,
      InterviewTemplateEntity,
      QuestionEntity,
    ]),
  ],
  providers: [
    // Write Repository (для Commands)
    {
      provide: 'IInterviewTemplateRepository',
      useClass: TypeOrmInterviewTemplateRepository,
    },
    // Read Repository (для Queries)
    InterviewTemplateReadRepository,
  ],
  exports: [
    TypeOrmModule,
    'IInterviewTemplateRepository',
    InterviewTemplateReadRepository,
  ],
})
export class DatabaseModule {}
