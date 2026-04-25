import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { UpdateUserCommand } from './update-user.command';
import type { User } from '../../../domain/aggregates/user.aggregate';
import { UserUpdateService } from '../../services/user-update.service';

/**
 * Thin CQRS adapter over {@link UserUpdateService}.
 */
@Injectable()
@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(private readonly userUpdate: UserUpdateService) {}

  execute(command: UpdateUserCommand): Promise<User> {
    return this.userUpdate.update({
      userId: command.userId,
      firstName: command.firstName,
      lastName: command.lastName,
      bio: command.bio,
      phone: command.phone,
      timezone: command.timezone,
      language: command.language,
    });
  }
}
