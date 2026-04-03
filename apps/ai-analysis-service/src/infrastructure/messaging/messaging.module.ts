import { Module, Global } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
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
 * Handles OUTBOX pattern with BullMQ workers for AI Analysis Service.
 *
 * Provides:
 * - OutboxService (saves events to outbox table, schedules BullMQ jobs)
 * - OutboxPublisherProcessor (BullMQ worker, publishes to Kafka)
 * - OutboxSchedulerService (cron-based recovery for stuck events)
 */
@Global()
@Module({
  imports: [
    // Kafka module (provides KAFKA_SERVICE)
    KafkaModule,

    // BullMQ Configuration
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get("REDIS_HOST", "localhost"),
          port: parseInt(configService.get("REDIS_PORT", "6379"), 10),
          ...(configService.get("REDIS_PASSWORD")
            ? { password: configService.get("REDIS_PASSWORD") }
            : {}),
        },
      }),
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
