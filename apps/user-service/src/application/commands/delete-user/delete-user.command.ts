import { Command } from '@nestjs/cqrs';

export class DeleteUserCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly deletedBy: string,
  ) {
    super();
  }
}
