import { IDomainEvent } from './domain-event.interface';

export class QuestionAddedEvent implements IDomainEvent {
  public readonly eventName = 'QuestionAdded';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly questionId: string,
    public readonly text: string,
    public readonly type: string,
    public readonly order: number,
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      questionId: this.questionId,
      text: this.text,
      type: this.type,
      order: this.order,
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
