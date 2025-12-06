import { IDomainEvent } from './domain-event.interface';

export class InvitationCreatedEvent implements IDomainEvent {
  public readonly eventName = 'InvitationCreated';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly templateId: string,
    public readonly candidateId: string,
    public readonly companyName: string,
    public readonly invitedBy: string,
    public readonly expiresAt: Date,
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      templateId: this.templateId,
      candidateId: this.candidateId,
      companyName: this.companyName,
      invitedBy: this.invitedBy,
      expiresAt: this.expiresAt.toISOString(),
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
