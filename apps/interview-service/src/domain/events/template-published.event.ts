import { IDomainEvent } from './domain-event.interface';

export class TemplatePublishedEvent implements IDomainEvent {
  public readonly eventName = 'TemplatePublished';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly title: string,
    public readonly questionCount: number,
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      title: this.title,
      questionCount: this.questionCount,
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
