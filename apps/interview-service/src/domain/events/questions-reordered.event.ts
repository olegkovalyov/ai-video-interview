import { IDomainEvent } from './domain-event.interface';

export class QuestionsReorderedEvent implements IDomainEvent {
  public readonly eventName = 'QuestionsReordered';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly questionIds: string[],
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      questionIds: this.questionIds,
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
