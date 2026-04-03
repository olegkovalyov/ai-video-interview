import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { KafkaService, KAFKA_TOPICS } from "@repo/shared";
import { LoggerService } from "../../logger/logger.service";
import { SendNotificationCommand } from "../../../application/commands/send-notification/send-notification.command";

@Injectable()
export class BillingEventsConsumer implements OnModuleInit {
  constructor(
    @Inject("KAFKA_SERVICE")
    private readonly kafkaService: KafkaService,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    try {
      // Non-blocking subscribe
      this.kafkaService.subscribe(
        KAFKA_TOPICS.BILLING_EVENTS,
        "notification-service-billing",
        async (message) => {
          const event = this.kafkaService.parseEvent(message);
          if (!event) return;

          const eventType = (event as any).eventType;

          switch (eventType) {
            case "subscription.upgraded":
              await this.handleSubscriptionUpgraded(event as any);
              break;
            case "subscription.past_due":
              await this.handleSubscriptionPastDue(event as any);
              break;
            case "quota.exceeded":
              await this.handleQuotaExceeded(event as any);
              break;
            default:
              break;
          }
        },
      );
      this.logger.info("Subscribed to billing-events", {
        action: "kafka.subscribe",
      });
    } catch (error) {
      this.logger.error("Failed to subscribe to billing-events", error);
    }
  }

  private async handleSubscriptionUpgraded(event: any): Promise<void> {
    const { payload } = event;
    if (!payload?.email) return;

    try {
      await this.commandBus.execute(
        new SendNotificationCommand(
          payload.userId || payload.companyId,
          payload.email,
          "email",
          "payment_confirmed",
          {
            planName: payload.newPlan || payload.planType || "Premium",
          },
        ),
      );
    } catch (error) {
      this.logger.error(
        "Failed to send payment confirmed notification",
        error,
        {
          action: "billing_events.upgraded_notification_failed",
        },
      );
    }
  }

  private async handleSubscriptionPastDue(event: any): Promise<void> {
    const { payload } = event;
    if (!payload?.email) return;

    try {
      await this.commandBus.execute(
        new SendNotificationCommand(
          payload.userId || payload.companyId,
          payload.email,
          "email",
          "payment_failed",
          {
            planName: payload.planType || "Subscription",
          },
        ),
      );
    } catch (error) {
      this.logger.error("Failed to send payment failed notification", error, {
        action: "billing_events.past_due_notification_failed",
      });
    }
  }

  private async handleQuotaExceeded(event: any): Promise<void> {
    const { payload } = event;
    if (!payload?.email) return;

    try {
      await this.commandBus.execute(
        new SendNotificationCommand(
          payload.userId || payload.companyId,
          payload.email,
          "email",
          "quota_exceeded",
          {
            resource: payload.resource || "interviews",
            planName: payload.planType || "Current",
            currentUsage: payload.currentUsage || 0,
            limit: payload.limit || 0,
          },
        ),
      );
    } catch (error) {
      this.logger.error("Failed to send quota exceeded notification", error, {
        action: "billing_events.quota_exceeded_notification_failed",
      });
    }
  }
}
