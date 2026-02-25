import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteUserCommand } from './delete-user.command';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../../domain/constants';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';

/**
 * Delete User Command Handler
 */
@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
    @Inject('IOutboxService')
    private readonly outboxService: IOutboxService,
    @Inject('IUnitOfWork')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    // 1. Find user by ID
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Mark as deleted (in memory, emits domain event)
    user.delete(command.deletedBy);

    // 3. Atomic: outbox save + hard delete in same transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      const eid = await this.outboxService.saveEvent(
        USER_EVENT_TYPES.DELETED,
        {
          userId: user.id,
          externalAuthId: user.externalAuthId,
          email: user.email.value,
          deletedAt: new Date().toISOString(),
        },
        user.id,
        tx,
      );
      await this.userRepository.delete(user.id, tx);
      return eid;
    });

    // 4. After commit: publish domain events (internal)
    user.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });

    // 5. Schedule BullMQ job for Kafka publishing
    await this.outboxService.schedulePublishing([eventId]);
  }
}
