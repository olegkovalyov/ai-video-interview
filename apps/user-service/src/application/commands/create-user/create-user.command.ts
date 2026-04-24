import { Command } from '@nestjs/cqrs';
import type { User } from '../../../domain/aggregates/user.aggregate';

export class CreateUserCommand extends Command<User> {
  constructor(
    public readonly userId: string,
    public readonly externalAuthId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
  ) {
    super();
  }
}
