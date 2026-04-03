import type { IDomainEvent } from "./domain-event.interface";

export class NotificationFailedEvent implements IDomainEvent {
  public readonly eventName = "notification.failed";

  constructor(
    public readonly aggregateId: string,
    public readonly recipientId: string,
    public readonly error: string,
    public readonly occurredOn: Date,
  ) {}
}
