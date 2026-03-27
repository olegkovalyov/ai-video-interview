import { Module, Global } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KafkaModule } from "../kafka/kafka.module";
import { OutboxEntity } from "../persistence/entities/outbox.entity";
import { OutboxService } from "./outbox/outbox.service";
import { OutboxPublisherProcessor } from "./outbox/outbox-publisher.processor";
import { OutboxSchedulerService } from "./outbox/outbox-scheduler.service";
import { BULL_QUEUE } from "../constants";

/**
 * Messaging Module
 * Handles OUTBOX pattern with Bull workers for AI Analysis Service.
 *
 * Provides:
 * - OutboxService (saves events to outbox table, schedules BullMQ jobs)
 * - OutboxPublisherProcessor (Bull job processor, publishes to Kafka)
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
          host: configService.get("REDIS_HOST", "localhost"),
          port: parseInt(configService.get("REDIS_PORT", "6379"), 10),
        };

        const password = configService.get("REDIS_PASSWORD");
        if (password) {
          redisConfig["password"] = password;
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

    // TypeORM entities
    TypeOrmModule.forFeature([OutboxEntity]),
  ],

  providers: [OutboxService, OutboxPublisherProcessor, OutboxSchedulerService],

  exports: [BullModule, OutboxService],
})
export class MessagingModule {}
