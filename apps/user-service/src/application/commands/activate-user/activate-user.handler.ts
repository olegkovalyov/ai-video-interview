import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateUserCommand } from './activate-user.command';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';

/**
 * Activate User Command Handler
 */
@CommandHandler(ActivateUserCommand)
export class ActivateUserHandler implements ICommandHandler<ActivateUserCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ActivateUserCommand): Promise<User> {
    // 1. Load user by external auth ID
    const user = await this.userRepository.findByExternalAuthId(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Activate
    user.activate();

    // 3. Save
    await this.userRepository.save(user);

    // 4. Publish events
    user.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    user.clearEvents();

    return user;
  }
}
