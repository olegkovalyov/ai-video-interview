/**
 * Domain Event: Candidate Skill Updated
 * Published when a candidate updates their skill metadata
 */
export class CandidateSkillUpdatedEvent {
  constructor(
    public readonly candidateId: string,
    public readonly skillId: string,
    public readonly changes: {
      description?: string | null;
      proficiencyLevel?: string;
      yearsOfExperience?: number;
    },
    public readonly occurredAt: Date = new Date(),
  ) {}
}
