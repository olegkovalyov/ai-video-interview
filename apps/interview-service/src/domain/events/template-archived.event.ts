import { IDomainEvent } from './domain-event.interface';

export class TemplateArchivedEvent implements IDomainEvent {
  public readonly eventName = 'TemplateArchived';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly title: string,
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      title: this.title,
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
