import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SuspendUserCommand } from './suspend-user.command';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../../domain/constants';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';

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
    @Inject('IUnitOfWork')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(command: SuspendUserCommand): Promise<User> {
    // 1. Load user by ID
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Suspend
    user.suspend(command.reason, command.suspendedBy);

    // 3. Atomic save: aggregate + outbox in same transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.userRepository.save(user, tx);
      return this.outboxService.saveEvent(
        USER_EVENT_TYPES.SUSPENDED,
        {
          userId: user.id,
          externalAuthId: user.externalAuthId,
          suspendedAt: new Date().toISOString(),
        },
        user.id,
        tx,
      );
    });

    // 4. After commit: publish domain events (internal)
    user.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    user.clearEvents();

    // 5. Schedule BullMQ job for Kafka publishing
    await this.outboxService.schedulePublishing([eventId]);

    return user;
  }
}
