import { Command } from '@nestjs/cqrs';

export class UpdateCandidateSkillCommand extends Command<void> {
  constructor(
    public readonly candidateId: string,
    public readonly skillId: string,
    public readonly description: string | null,
    public readonly proficiencyLevel: string | null,
    public readonly yearsOfExperience: number | null,
  ) {
    super();
  }
}
