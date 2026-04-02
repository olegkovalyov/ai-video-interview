import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./controllers/health.controller";
import { NotificationController } from "./controllers/notification.controller";
import { PreferencesController } from "./controllers/preferences.controller";
import { WebhookController } from "./controllers/webhook.controller";
import { InternalServiceGuard } from "./guards/internal-service.guard";
import { KafkaModule } from "../kafka/kafka.module";

@Module({
  imports: [ConfigModule, KafkaModule],
  controllers: [
    HealthController,
    NotificationController,
    PreferencesController,
    WebhookController,
  ],
  providers: [InternalServiceGuard],
  exports: [InternalServiceGuard],
})
export class HttpModule {}
