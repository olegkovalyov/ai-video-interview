import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { KafkaModule } from '../kafka/kafka.module';
import { InboxEntity } from '../persistence/entities/inbox.entity';
import { OutboxEntity } from '../persistence/entities/outbox.entity';
import { InboxConsumerService } from './inbox/inbox-consumer.service';
import { InboxWorkerProcessor } from './inbox/inbox-worker.processor';
import { InboxSchedulerService } from './inbox/inbox-scheduler.service';
import { OutboxService } from './outbox/outbox.service';
import { OutboxPublisherProcessor } from './outbox/outbox-publisher.processor';
import { OutboxSchedulerService } from './outbox/outbox-scheduler.service';

/**
 * Messaging Module
 * Handles INBOX/OUTBOX pattern with BullMQ workers
 */
@Module({
  imports: [
    // Kafka module (provides KAFKA_SERVICE)
    KafkaModule,

    // BullMQ Configuration
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisConfig = {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: parseInt(configService.get('REDIS_PORT', '6379'), 10),
        };
        
        const password = configService.get('REDIS_PASSWORD');
        if (password) {
          redisConfig['password'] = password;
        }
        
        return {
          redis: {
            ...redisConfig,
            maxRetriesPerRequest: null, // Required for BullMQ
            enableReadyCheck: false,    // Skip ready check for faster startup
            retryStrategy: (times: number) => {
              if (times > 10) return null; // Stop after 10 retries
              return Math.min(times * 50, 2000); // Max 2s between retries
            },
          },
        } as any; // Type workaround for @nestjs/bull compatibility
      },
      inject: [ConfigService],
    }),

    // Register Queues
    BullModule.registerQueue(
      {
        name: 'inbox-processor',
      },
      {
        name: 'outbox-publisher',
      },
    ),

    // Scheduler for polling
    ScheduleModule.forRoot(),

    // CQRS for command handling
    CqrsModule,

    // TypeORM entities
    TypeOrmModule.forFeature([InboxEntity, OutboxEntity]),
  ],

  providers: [
    // INBOX
    InboxConsumerService,
    InboxWorkerProcessor,
    InboxSchedulerService,

    // OUTBOX
    OutboxService,
    OutboxPublisherProcessor,
    OutboxSchedulerService,
  ],

  exports: [
    BullModule,
    InboxConsumerService,
    OutboxService,
  ],
})
export class MessagingModule {}
