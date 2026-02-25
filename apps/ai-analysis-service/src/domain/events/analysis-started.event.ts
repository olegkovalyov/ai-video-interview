import { DomainEvent } from '../../shared/base/aggregate-root';
import { v4 as uuidv4 } from 'uuid';

export class AnalysisStartedEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly invitationId: string;

  constructor(analysisId: string, invitationId: string) {
    this.eventId = uuidv4();
    this.occurredAt = new Date();
    this.aggregateId = analysisId;
    this.invitationId = invitationId;
  }
}
