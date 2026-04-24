import { Command } from '@nestjs/cqrs';

export class CreateSkillCommand extends Command<{ skillId: string }> {
  constructor(
    public readonly name: string,
    public readonly slug: string,
    public readonly categoryId: string | null,
    public readonly description: string | null,
    public readonly adminId: string,
  ) {
    super();
  }
}
