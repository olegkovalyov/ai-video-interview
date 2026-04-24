import { Command } from '@nestjs/cqrs';

export class AddCandidateSkillCommand extends Command<{
  candidateSkillId: string;
}> {
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
