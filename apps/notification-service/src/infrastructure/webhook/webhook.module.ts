import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { CqrsModule } from "@nestjs/cqrs";
import { WebhookDeliveryProcessor } from "./webhook-delivery.processor";
import { BULL_QUEUE } from "../constants";
import { MetricsModule } from "../metrics/metrics.module";

@Module({
  imports: [
    BullModule.registerQueue({
      name: BULL_QUEUE.WEBHOOK_DELIVERY,
    }),
    CqrsModule,
    MetricsModule,
  ],
  providers: [WebhookDeliveryProcessor],
  exports: [BullModule],
})
export class WebhookModule {}
