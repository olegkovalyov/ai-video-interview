import type { IDomainEvent } from './domain-event.interface';

/**
 * Typed changes for CandidateSkillUpdatedEvent
 */
export interface CandidateSkillChanges {
  description?: string | null;
  proficiencyLevel?: string | null;
  yearsOfExperience?: number | null;
}

/**
 * Domain Event: Candidate Skill Updated
 * Published when a candidate updates their skill metadata
 */
export class CandidateSkillUpdatedEvent implements IDomainEvent {
  constructor(
    public readonly candidateId: string,
    public readonly skillId: string,
    public readonly changes: CandidateSkillChanges,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
