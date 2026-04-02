import { IDomainEvent } from "./domain-event.interface";

export class SubscriptionUpgradedEvent implements IDomainEvent {
  public readonly eventName = "SubscriptionUpgraded";
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly companyId: string,
    public readonly previousPlan: string,
    public readonly newPlan: string,
    public readonly stripeSubscriptionId: string,
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      companyId: this.companyId,
      previousPlan: this.previousPlan,
      newPlan: this.newPlan,
      stripeSubscriptionId: this.stripeSubscriptionId,
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
