import type { IDomainEvent } from './domain-event.interface';

/**
 * Construction args for {@link CandidateSkillAddedEvent}. `occurredAt`
 * defaults to now.
 */
export interface CandidateSkillAddedEventProps {
  candidateId: string;
  skillId: string;
  proficiencyLevel: string;
  yearsOfExperience: number;
  occurredAt?: Date;
}

/**
 * Domain Event: Candidate Skill Added.
 * Published when a candidate adds a skill to their profile.
 */
export class CandidateSkillAddedEvent implements IDomainEvent {
  public readonly candidateId: string;
  public readonly skillId: string;
  public readonly proficiencyLevel: string;
  public readonly yearsOfExperience: number;
  public readonly occurredAt: Date;

  constructor(props: CandidateSkillAddedEventProps) {
    this.candidateId = props.candidateId;
    this.skillId = props.skillId;
    this.proficiencyLevel = props.proficiencyLevel;
    this.yearsOfExperience = props.yearsOfExperience;
    this.occurredAt = props.occurredAt ?? new Date();
  }
}
