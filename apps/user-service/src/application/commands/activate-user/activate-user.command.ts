import { Command } from '@nestjs/cqrs';
import type { User } from '../../../domain/aggregates/user.aggregate';

export class ActivateUserCommand extends Command<User> {
  constructor(public readonly userId: string) {
    super();
  }
}
