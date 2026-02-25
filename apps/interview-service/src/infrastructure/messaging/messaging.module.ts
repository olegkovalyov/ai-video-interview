import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { KafkaModule } from '../kafka/kafka.module';
import { OutboxEntity } from '../persistence/entities/outbox.entity';
import { OutboxService } from './outbox/outbox.service';
import { OutboxPublisherProcessor } from './outbox/outbox-publisher.processor';
import { OutboxSchedulerService } from './outbox/outbox-scheduler.service';
import { BULL_QUEUE } from '../constants';

/**
 * Messaging Module
 * Handles OUTBOX pattern with Bull workers.
 *
 * Provides:
 * - OutboxService (concrete class for DI resolution)
 * - 'IOutboxService' token (for application-layer injection via useExisting)
 * - OutboxPublisherProcessor (Bull job processor)
 * - OutboxSchedulerService (cron-based recovery for stuck events)
 */
@Global()
@Module({
  imports: [
    // Kafka module (provides KAFKA_SERVICE)
    KafkaModule,

    // Bull Configuration
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
            maxRetriesPerRequest: null, // Required for Bull
            enableReadyCheck: false, // Skip ready check for faster startup
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
    BullModule.registerQueue({
      name: BULL_QUEUE.OUTBOX_PUBLISHER,
    }),

    // Scheduler for polling
    ScheduleModule.forRoot(),

    // CQRS for command handling
    CqrsModule,

    // TypeORM entities
    TypeOrmModule.forFeature([OutboxEntity]),
  ],

  providers: [
    // OUTBOX - concrete class for DI resolution
    OutboxService,
    // OUTBOX - interface token for application-layer injection (reuses same instance)
    {
      provide: 'IOutboxService',
      useExisting: OutboxService,
    },
    OutboxPublisherProcessor,
    OutboxSchedulerService,
  ],

  exports: [
    BullModule,
    OutboxService,
    'IOutboxService',
  ],
})
export class MessagingModule {}
