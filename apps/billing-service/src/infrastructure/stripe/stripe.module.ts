import { CqrsModule } from "@nestjs/cqrs";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bull";
import { StripeService } from "./stripe.service";
import { WebhookProcessor } from "./webhook.processor";

@Module({
  imports: [CqrsModule,
    ConfigModule,
    BullModule.registerQueue({ name: "stripe-webhooks" }),
  ],
  providers: [
    StripeService,
    WebhookProcessor,
    {
      provide: "IStripeService",
      useExisting: StripeService,
    },
  ],
  exports: [StripeService, "IStripeService", BullModule],
})
export class StripeModule {}
