import { Command } from '@nestjs/cqrs';

export class RemoveCandidateSkillCommand extends Command<void> {
  constructor(
    public readonly candidateId: string,
    public readonly skillId: string,
  ) {
    super();
  }
}
