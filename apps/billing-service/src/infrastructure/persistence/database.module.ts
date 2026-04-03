import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { OutboxEntity } from "./entities/outbox.entity";
import { SubscriptionEntity } from "./entities/subscription.entity";
import { UsageRecordEntity } from "./entities/usage-record.entity";
import { PaymentEventEntity } from "./entities/payment-event.entity";
import { TypeOrmSubscriptionRepository } from "./repositories/typeorm-subscription.repository";
import { TypeOrmUnitOfWork } from "./unit-of-work/typeorm-unit-of-work";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("DATABASE_HOST", "localhost"),
        port: parseInt(configService.get("DATABASE_PORT", "5432"), 10),
        username: configService.get("DATABASE_USER", "postgres"),
        password: configService.get("DATABASE_PASSWORD", "postgres"),
        database: configService.get(
          "DATABASE_NAME",
          "ai_video_interview_billing",
        ),
        entities: [
          OutboxEntity,
          SubscriptionEntity,
          UsageRecordEntity,
          PaymentEventEntity,
        ],
        synchronize: false,
        logging: false,
        ssl:
          configService.get("DATABASE_SSL", "false") === "true"
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      OutboxEntity,
      SubscriptionEntity,
      UsageRecordEntity,
      PaymentEventEntity,
    ]),
  ],
  providers: [
    {
      provide: "ISubscriptionRepository",
      useClass: TypeOrmSubscriptionRepository,
    },
    {
      provide: "IUnitOfWork",
      useClass: TypeOrmUnitOfWork,
    },
  ],
  exports: [TypeOrmModule, "ISubscriptionRepository", "IUnitOfWork"],
})
export class DatabaseModule {}
