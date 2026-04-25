import { Command } from '@nestjs/cqrs';
import type { User } from '../../../domain/aggregates/user.aggregate';

export interface UpdateUserCommandProps {
  userId: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  timezone?: string;
  language?: string;
}

export class UpdateUserCommand extends Command<User> {
  public readonly userId: string;
  public readonly firstName?: string;
  public readonly lastName?: string;
  public readonly bio?: string;
  public readonly phone?: string;
  public readonly timezone?: string;
  public readonly language?: string;

  constructor(props: UpdateUserCommandProps) {
    super();
    this.userId = props.userId;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.bio = props.bio;
    this.phone = props.phone;
    this.timezone = props.timezone;
    this.language = props.language;
  }
}
