/**
 * Command: Add Candidate Skill
 * Candidate adds a skill to their profile
 */
export class AddCandidateSkillCommand {
  constructor(
    public readonly candidateId: string,
    public readonly skillId: string,
    public readonly description: string | null,
    public readonly proficiencyLevel: string,
    public readonly yearsOfExperience: number,
  ) {}
}
