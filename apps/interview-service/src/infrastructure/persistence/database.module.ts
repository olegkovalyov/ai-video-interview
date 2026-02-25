import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OutboxEntity } from './entities/outbox.entity';
import { InterviewTemplateEntity } from './entities/interview-template.entity';
import { QuestionEntity } from './entities/question.entity';
import { InvitationEntity } from './entities/invitation.entity';
import { ResponseEntity } from './entities/response.entity';
import { TypeOrmInterviewTemplateRepository } from './repositories/typeorm-interview-template.repository';
import { InterviewTemplateReadRepository } from './repositories/interview-template-read.repository';
import { TypeOrmQuestionRepository } from './repositories/typeorm-question.repository';
import { TypeOrmInvitationRepository } from './repositories/typeorm-invitation.repository';
import { InvitationReadRepository } from './repositories/invitation-read.repository';
import { TypeOrmUnitOfWork } from './unit-of-work/typeorm-unit-of-work';

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
        entities: [
          OutboxEntity,
          InterviewTemplateEntity,
          QuestionEntity,
          InvitationEntity,
          ResponseEntity,
        ],
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
      InvitationEntity,
      ResponseEntity,
    ]),
  ],
  providers: [
    // Template Write Repository (для Commands)
    {
      provide: 'IInterviewTemplateRepository',
      useClass: TypeOrmInterviewTemplateRepository,
    },
    {
      provide: 'IQuestionRepository',
      useClass: TypeOrmQuestionRepository,
    },
    // Invitation Write Repository (для Commands)
    {
      provide: 'IInvitationRepository',
      useClass: TypeOrmInvitationRepository,
    },
    // Read Repositories (для Queries) — через DI tokens
    {
      provide: 'IInterviewTemplateReadRepository',
      useClass: InterviewTemplateReadRepository,
    },
    {
      provide: 'IInvitationReadRepository',
      useClass: InvitationReadRepository,
    },
    // UnitOfWork
    {
      provide: 'IUnitOfWork',
      useClass: TypeOrmUnitOfWork,
    },
  ],
  exports: [
    TypeOrmModule,
    'IInterviewTemplateRepository',
    'IQuestionRepository',
    'IInvitationRepository',
    'IInterviewTemplateReadRepository',
    'IInvitationReadRepository',
    'IUnitOfWork',
  ],
})
export class DatabaseModule {}
