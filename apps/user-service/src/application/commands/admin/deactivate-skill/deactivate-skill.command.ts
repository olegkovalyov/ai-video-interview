import { Command } from '@nestjs/cqrs';

export class DeactivateSkillCommand extends Command<void> {
  constructor(
    public readonly skillId: string,
    public readonly adminId: string,
  ) {
    super();
  }
}
