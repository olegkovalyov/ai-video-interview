import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RemoveRoleCommand } from './remove-role.command';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { OutboxService } from '../../../infrastructure/messaging/outbox/outbox.service';
import { v4 as uuid } from 'uuid';

/**
 * Remove Role Command Handler
 */
@CommandHandler(RemoveRoleCommand)
export class RemoveRoleHandler implements ICommandHandler<RemoveRoleCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
    private readonly outboxService: OutboxService,
  ) {}

  async execute(command: RemoveRoleCommand): Promise<User> {
    // 1. Load user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Remove role
    user.removeRole(command.roleName, command.removedBy || 'system');

    // 3. Save
    await this.userRepository.save(user);

    // 4. Publish domain events (internal only)
    user.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    user.clearEvents();

    // 5. Publish integration event to Kafka (for other services)
    await this.outboxService.saveEvent(
      'user.role_removed',
      {
        eventId: uuid(),
        eventType: 'user.role_removed',
        timestamp: Date.now(),
        version: '1.0',
        source: 'user-service',
        payload: {
          userId: user.id,
          keycloakId: user.keycloakId,
          roleName: command.roleName,
          removedBy: command.removedBy,
          removedAt: new Date().toISOString(),
        },
      },
      user.id,
    );

    return user;
  }
}
