import { Command } from '@nestjs/cqrs';

export class ActivateSkillCommand extends Command<void> {
  constructor(
    public readonly skillId: string,
    public readonly adminId: string,
  ) {
    super();
  }
}
