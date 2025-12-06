import { IDomainEvent } from './domain-event.interface';

export class InvitationStartedEvent implements IDomainEvent {
  public readonly eventName = 'InvitationStarted';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly candidateId: string,
    public readonly templateId: string,
    public readonly startedAt: Date,
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      candidateId: this.candidateId,
      templateId: this.templateId,
      startedAt: this.startedAt.toISOString(),
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
