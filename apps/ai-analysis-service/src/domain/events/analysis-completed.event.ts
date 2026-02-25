import { DomainEvent } from '../../shared/base/aggregate-root';
import { v4 as uuidv4 } from 'uuid';

export class AnalysisCompletedEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly invitationId: string;
  readonly overallScore: number;
  readonly recommendation: string;
  readonly questionsAnalyzed: number;

  constructor(
    analysisId: string,
    invitationId: string,
    overallScore: number,
    recommendation: string,
    questionsAnalyzed: number,
  ) {
    this.eventId = uuidv4();
    this.occurredAt = new Date();
    this.aggregateId = analysisId;
    this.invitationId = invitationId;
    this.overallScore = overallScore;
    this.recommendation = recommendation;
    this.questionsAnalyzed = questionsAnalyzed;
  }
}
