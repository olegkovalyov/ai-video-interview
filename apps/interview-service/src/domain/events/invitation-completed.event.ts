import { IDomainEvent } from './domain-event.interface';

export type CompletedReason = 'manual' | 'auto_timeout' | 'expired';

export interface QuestionData {
  id: string;
  text: string;
  type: string;
  order: number;
  timeLimit: number;
  correctAnswer?: string;
}

export interface ResponseData {
  questionId: string;
  text: string;
  duration: number;
}

export class InvitationCompletedEvent implements IDomainEvent {
  public readonly eventName = 'InvitationCompleted';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly candidateId: string,
    public readonly templateId: string,
    public readonly templateTitle: string,
    public readonly companyName: string,
    public readonly reason: CompletedReason,
    public readonly answeredCount: number,
    public readonly totalQuestions: number,
    public readonly completedAt: Date,
    public readonly language: string,
    public readonly questions: QuestionData[],
    public readonly responses: ResponseData[],
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      candidateId: this.candidateId,
      templateId: this.templateId,
      templateTitle: this.templateTitle,
      companyName: this.companyName,
      reason: this.reason,
      answeredCount: this.answeredCount,
      totalQuestions: this.totalQuestions,
      completedAt: this.completedAt.toISOString(),
      occurredOn: this.occurredOn.toISOString(),
      language: this.language,
      questions: this.questions,
      responses: this.responses,
    };
  }
}
