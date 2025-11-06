import { IDomainEvent } from './domain-event.interface';

export class QuestionRemovedEvent implements IDomainEvent {
  public readonly eventName = 'QuestionRemoved';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly questionId: string,
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      questionId: this.questionId,
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
