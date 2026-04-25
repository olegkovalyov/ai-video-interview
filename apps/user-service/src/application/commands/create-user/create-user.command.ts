import { Command } from '@nestjs/cqrs';
import type { User } from '../../../domain/aggregates/user.aggregate';

export interface CreateUserCommandProps {
  userId: string;
  externalAuthId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export class CreateUserCommand extends Command<User> {
  public readonly userId: string;
  public readonly externalAuthId: string;
  public readonly email: string;
  public readonly firstName: string;
  public readonly lastName: string;

  constructor(props: CreateUserCommandProps) {
    super();
    this.userId = props.userId;
    this.externalAuthId = props.externalAuthId;
    this.email = props.email;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
  }
}
