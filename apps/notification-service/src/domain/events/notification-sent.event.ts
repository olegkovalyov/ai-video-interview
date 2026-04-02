import type { IDomainEvent } from "./domain-event.interface";

export class NotificationSentEvent implements IDomainEvent {
  public readonly eventName = "notification.sent";

  constructor(
    public readonly aggregateId: string,
    public readonly recipientId: string,
    public readonly occurredOn: Date,
  ) {}
}
