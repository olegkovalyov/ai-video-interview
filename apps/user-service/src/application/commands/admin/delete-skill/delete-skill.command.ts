import { Command } from '@nestjs/cqrs';

export class DeleteSkillCommand extends Command<void> {
  constructor(
    public readonly skillId: string,
    public readonly adminId: string,
  ) {
    super();
  }
}
