import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./controllers/health.controller";
import { BillingController } from "./controllers/billing.controller";
import { WebhookController } from "./controllers/webhook.controller";
import { InternalServiceGuard } from "./guards/internal-service.guard";
import { KafkaModule } from "../kafka/kafka.module";
import { StripeModule } from "../stripe/stripe.module";

@Module({
  imports: [ConfigModule, KafkaModule, StripeModule],
  controllers: [HealthController, BillingController, WebhookController],
  providers: [InternalServiceGuard],
  exports: [InternalServiceGuard],
})
export class HttpModule {}
