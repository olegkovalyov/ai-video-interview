import { IDomainEvent } from './domain-event.interface';

export class CandidateRejectedEvent implements IDomainEvent {
  public readonly eventName = 'CandidateRejected';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly candidateId: string,
    public readonly templateId: string,
    public readonly templateTitle: string,
    public readonly companyName: string,
    public readonly hrUserId: string,
    public readonly note: string,
    public readonly decidedAt: Date,
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
      hrUserId: this.hrUserId,
      note: this.note,
      decidedAt: this.decidedAt.toISOString(),
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
