import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { OutboxEntity } from "./entities/outbox.entity";
import { NotificationEntity } from "./entities/notification.entity";
import { WebhookEndpointEntity } from "./entities/webhook-endpoint.entity";
import { NotificationPreferenceEntity } from "./entities/notification-preference.entity";
import { TypeOrmNotificationRepository } from "./repositories/typeorm-notification.repository";
import { TypeOrmWebhookEndpointRepository } from "./repositories/typeorm-webhook-endpoint.repository";
import { TypeOrmNotificationPreferenceRepository } from "./repositories/typeorm-notification-preference.repository";
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
          "ai_video_interview_notification",
        ),
        entities: [
          OutboxEntity,
          NotificationEntity,
          WebhookEndpointEntity,
          NotificationPreferenceEntity,
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
      NotificationEntity,
      WebhookEndpointEntity,
      NotificationPreferenceEntity,
    ]),
  ],
  providers: [
    {
      provide: "INotificationRepository",
      useClass: TypeOrmNotificationRepository,
    },
    {
      provide: "IWebhookEndpointRepository",
      useClass: TypeOrmWebhookEndpointRepository,
    },
    {
      provide: "INotificationPreferenceRepository",
      useClass: TypeOrmNotificationPreferenceRepository,
    },
    {
      provide: "IUnitOfWork",
      useClass: TypeOrmUnitOfWork,
    },
  ],
  exports: [
    TypeOrmModule,
    "INotificationRepository",
    "IWebhookEndpointRepository",
    "INotificationPreferenceRepository",
    "IUnitOfWork",
  ],
})
export class DatabaseModule {}
