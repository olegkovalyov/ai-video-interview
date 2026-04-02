import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { SubscriptionUpgradedEvent } from "../../domain/events/subscription-upgraded.event";
import { LoggerService } from "../../infrastructure/logger/logger.service";

/**
 * Event handler for SubscriptionUpgradedEvent
 *
 * Internal side effects only (logging, metrics).
 * Outbox save is handled atomically inside ProcessStripeWebhookHandler
 * via UnitOfWork (aggregate save + outbox save in same transaction).
 */
@Injectable()
@EventsHandler(SubscriptionUpgradedEvent)
export class SubscriptionUpgradedHandler
  implements IEventHandler<SubscriptionUpgradedEvent>
{
  constructor(private readonly logger: LoggerService) {}

  async handle(event: SubscriptionUpgradedEvent): Promise<void> {
    this.logger.eventLog("SubscriptionUpgraded", {
      action: "subscription.upgraded",
      companyId: event.companyId,
      previousPlan: event.previousPlan,
      newPlan: event.newPlan,
    } as any);
  }
}
