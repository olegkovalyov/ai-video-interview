import { IDomainEvent } from "./domain-event.interface";

export class SubscriptionCreatedEvent implements IDomainEvent {
  public readonly eventName = "SubscriptionCreated";
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly companyId: string,
    public readonly planType: string,
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      companyId: this.companyId,
      planType: this.planType,
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
