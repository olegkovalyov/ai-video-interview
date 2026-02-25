import { IDomainEvent } from './domain-event.interface';

export class ResponseSubmittedEvent implements IDomainEvent {
  public readonly eventName = 'ResponseSubmitted';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly responseId: string,
    public readonly questionId: string,
    public readonly responseType: string,
    public readonly answeredCount: number,
    public readonly totalQuestions: number,
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      responseId: this.responseId,
      questionId: this.questionId,
      responseType: this.responseType,
      answeredCount: this.answeredCount,
      totalQuestions: this.totalQuestions,
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
