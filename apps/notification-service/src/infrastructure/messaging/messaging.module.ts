import { Module, Global } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CqrsModule } from "@nestjs/cqrs";
import { KafkaModule } from "../kafka/kafka.module";
import { OutboxEntity } from "../persistence/entities/outbox.entity";
import { OutboxService } from "./outbox/outbox.service";
import { OutboxPublisherProcessor } from "./outbox/outbox-publisher.processor";
import { OutboxSchedulerService } from "./outbox/outbox-scheduler.service";
import { BULL_QUEUE } from "../constants";

@Global()
@Module({
  imports: [
    KafkaModule,

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
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy: (times: number) => {
              if (times > 10) return null;
              return Math.min(times * 50, 2000);
            },
          },
        } as any;
      },
      inject: [ConfigService],
    }),

    BullModule.registerQueue({
      name: BULL_QUEUE.OUTBOX_PUBLISHER,
    }),

    ScheduleModule.forRoot(),
    CqrsModule,
    TypeOrmModule.forFeature([OutboxEntity]),
  ],

  providers: [
    OutboxService,
    {
      provide: "IOutboxService",
      useExisting: OutboxService,
    },
    OutboxPublisherProcessor,
    OutboxSchedulerService,
  ],

  exports: [BullModule, OutboxService, "IOutboxService"],
})
export class MessagingModule {}
