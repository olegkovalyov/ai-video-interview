import { Command } from '@nestjs/cqrs';

export class UpdateCandidateExperienceLevelCommand extends Command<void> {
  constructor(
    public readonly candidateId: string,
    public readonly experienceLevel: string,
  ) {
    super();
  }
}
