import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { SubscriptionCreatedEvent } from "../../domain/events/subscription-created.event";
import { LoggerService } from "../../infrastructure/logger/logger.service";

/**
 * Event handler for SubscriptionCreatedEvent
 *
 * Internal side effects only (logging, metrics).
 * Outbox save is handled atomically inside CreateFreeSubscriptionHandler
 * via UnitOfWork (aggregate save + outbox save in same transaction).
 */
@Injectable()
@EventsHandler(SubscriptionCreatedEvent)
export class SubscriptionCreatedHandler
  implements IEventHandler<SubscriptionCreatedEvent>
{
  constructor(private readonly logger: LoggerService) {}

  async handle(event: SubscriptionCreatedEvent): Promise<void> {
    this.logger.eventLog("SubscriptionCreated", {
      action: "subscription.created",
      companyId: event.companyId,
      planType: event.planType,
    } as any);
  }
}
