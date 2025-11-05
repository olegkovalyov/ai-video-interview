export interface IDomainEvent {
  aggregateId: string;
  occurredOn: Date;
  eventName: string;
}
