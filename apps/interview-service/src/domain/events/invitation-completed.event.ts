import { IDomainEvent } from './domain-event.interface';

export type CompletedReason = 'manual' | 'auto_timeout' | 'expired';

export class InvitationCompletedEvent implements IDomainEvent {
  public readonly eventName = 'InvitationCompleted';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly candidateId: string,
    public readonly templateId: string,
    public readonly reason: CompletedReason,
    public readonly answeredCount: number,
    public readonly totalQuestions: number,
    public readonly completedAt: Date,
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      candidateId: this.candidateId,
      templateId: this.templateId,
      reason: this.reason,
      answeredCount: this.answeredCount,
      totalQuestions: this.totalQuestions,
      completedAt: this.completedAt.toISOString(),
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
