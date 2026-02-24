import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteUserCommand } from './delete-user.command';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../../domain/constants';
import type { IOutboxService } from '../../ports/outbox-service.port';

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
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    // 1. Find user by ID
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Publish domain event BEFORE deletion (internal only)
    user.delete(command.deletedBy);
    user.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });

    // 3. Publish integration event to Kafka BEFORE deletion
    await this.outboxService.saveEvent(
      USER_EVENT_TYPES.DELETED,
      {
        userId: user.id,
        externalAuthId: user.externalAuthId,
        email: user.email.value,
        deletedAt: new Date().toISOString(),
      },
      user.id,
    );

    // 4. Hard delete from database (CASCADE will delete related records)
    await this.userRepository.delete(user.id);
  }
}
