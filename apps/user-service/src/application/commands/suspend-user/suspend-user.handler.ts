import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SuspendUserCommand } from './suspend-user.command';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../../domain/constants';
import type { IOutboxService } from '../../ports/outbox-service.port';

/**
 * Suspend User Command Handler
 */
@CommandHandler(SuspendUserCommand)
export class SuspendUserHandler implements ICommandHandler<SuspendUserCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
    @Inject('IOutboxService')
    private readonly outboxService: IOutboxService,
  ) {}

  async execute(command: SuspendUserCommand): Promise<User> {
    // 1. Load user by ID
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Suspend
    user.suspend(command.reason, command.suspendedBy);

    // 3. Save
    await this.userRepository.save(user);

    // 4. Publish domain events (internal)
    user.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    user.clearEvents();

    // 5. Publish integration event to Kafka
    await this.outboxService.saveEvent(
      USER_EVENT_TYPES.SUSPENDED,
      {
        userId: user.id,
        externalAuthId: user.externalAuthId,
        suspendedAt: new Date().toISOString(),
      },
      user.id,
    );

    return user;
  }
}
