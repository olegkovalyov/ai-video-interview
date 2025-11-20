/**
 * Domain Event: Candidate Skill Removed
 * Published when a candidate removes a skill from their profile
 */
export class CandidateSkillRemovedEvent {
  constructor(
    public readonly candidateId: string,
    public readonly skillId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
