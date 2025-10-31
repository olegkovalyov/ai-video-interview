import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteUserCommand } from './delete-user.command';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { OutboxService } from '../../../infrastructure/messaging/outbox/outbox.service';
import { v4 as uuid } from 'uuid';

/**
 * Delete User Command Handler
 */
@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
    private readonly outboxService: OutboxService,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    // 1. Find user by external auth ID
    const user = await this.userRepository.findByExternalAuthId(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Publish domain event BEFORE deletion (internal only)
    user.delete(command.deletedBy);
    user.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });

    // 3. Publish integration event to Kafka BEFORE deletion (for other services)
    await this.outboxService.saveEvent(
      'user.deleted',
      {
        eventId: uuid(),
        eventType: 'user.deleted',
        timestamp: Date.now(),
        version: '1.0',
        source: 'user-service',
        payload: {
          userId: user.id,
          externalAuthId: user.externalAuthId,
          email: user.email.value,
          deletedAt: new Date().toISOString(),
        },
      },
      user.id,
    );

    // 4. Hard delete from database (CASCADE will delete related records)
    await this.userRepository.delete(user.id);
  }
}
