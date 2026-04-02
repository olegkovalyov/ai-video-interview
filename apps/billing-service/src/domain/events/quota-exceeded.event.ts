import { IDomainEvent } from "./domain-event.interface";

export class QuotaExceededEvent implements IDomainEvent {
  public readonly eventName = "QuotaExceeded";
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly companyId: string,
    public readonly resource: string,
    public readonly currentUsage: number,
    public readonly limit: number,
    public readonly planType: string,
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      companyId: this.companyId,
      resource: this.resource,
      currentUsage: this.currentUsage,
      limit: this.limit,
      planType: this.planType,
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
