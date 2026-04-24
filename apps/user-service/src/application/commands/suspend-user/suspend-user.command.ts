import { Command } from '@nestjs/cqrs';
import type { User } from '../../../domain/aggregates/user.aggregate';

export class SuspendUserCommand extends Command<User> {
  constructor(
    public readonly userId: string,
    public readonly reason: string,
    public readonly suspendedBy: string,
  ) {
    super();
  }
}
