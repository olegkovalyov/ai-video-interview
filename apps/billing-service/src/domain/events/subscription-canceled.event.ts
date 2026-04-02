import { IDomainEvent } from "./domain-event.interface";

export class SubscriptionCanceledEvent implements IDomainEvent {
  public readonly eventName = "SubscriptionCanceled";
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly companyId: string,
    public readonly planType: string,
    public readonly cancelAtPeriodEnd: boolean,
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      companyId: this.companyId,
      planType: this.planType,
      cancelAtPeriodEnd: this.cancelAtPeriodEnd,
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
