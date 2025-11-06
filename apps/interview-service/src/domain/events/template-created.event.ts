import { IDomainEvent } from './domain-event.interface';

export class TemplateCreatedEvent implements IDomainEvent {
  public readonly eventName = 'TemplateCreated';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly createdBy: string,
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      title: this.title,
      description: this.description,
      createdBy: this.createdBy,
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
