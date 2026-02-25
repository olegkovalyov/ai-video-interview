import type { IDomainEvent } from './domain-event.interface';

/**
 * Domain Event: Candidate Skill Added
 * Published when a candidate adds a skill to their profile
 */
export class CandidateSkillAddedEvent implements IDomainEvent {
  constructor(
    public readonly candidateId: string,
    public readonly skillId: string,
    public readonly proficiencyLevel: string,
    public readonly yearsOfExperience: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
