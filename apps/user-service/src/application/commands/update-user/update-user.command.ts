import { Command } from '@nestjs/cqrs';
import type { User } from '../../../domain/aggregates/user.aggregate';

export class UpdateUserCommand extends Command<User> {
  constructor(
    public readonly userId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly bio?: string,
    public readonly phone?: string,
    public readonly timezone?: string,
    public readonly language?: string,
  ) {
    super();
  }
}
