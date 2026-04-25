import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from './create-user.command';
import { User } from '../../../domain/aggregates/user.aggregate';
import { UserCreationService } from '../../services/user-creation.service';

/**
 * Thin CQRS adapter over {@link UserCreationService}.
 * The use-case logic lives in the service so it can be reused outside
 * CQRS (batch imports, fixtures); this handler just translates the
 * command shape into the service input.
 */
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly userCreation: UserCreationService) {}

  execute(command: CreateUserCommand): Promise<User> {
    return this.userCreation.create({
      userId: command.userId,
      externalAuthId: command.externalAuthId,
      email: command.email,
      firstName: command.firstName,
      lastName: command.lastName,
    });
  }
}
