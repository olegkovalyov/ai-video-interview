import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { AssignRoleCommand } from './assign-role.command';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { OutboxService } from '../../../infrastructure/messaging/outbox/outbox.service';
import { v4 as uuid } from 'uuid';

/**
 * Assign Role Command Handler
 */
@CommandHandler(AssignRoleCommand)
export class AssignRoleHandler implements ICommandHandler<AssignRoleCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
    private readonly outboxService: OutboxService,
  ) {}

  async execute(command: AssignRoleCommand): Promise<User> {
    // 1. Load user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Assign role
    user.assignRole(command.roleName, command.assignedBy || 'system');

    // 3. Save
    await this.userRepository.save(user);

    // 4. Publish domain events (internal only)
    user.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    user.clearEvents();

    // 5. Publish integration event to Kafka (for other services)
    await this.outboxService.saveEvent(
      'user.role_assigned',
      {
        eventId: uuid(),
        eventType: 'user.role_assigned',
        timestamp: Date.now(),
        version: '1.0',
        source: 'user-service',
        payload: {
          userId: user.id,
          keycloakId: user.keycloakId,
          roleName: command.roleName,
          assignedBy: command.assignedBy,
          assignedAt: new Date().toISOString(),
        },
      },
      user.id,
    );

    return user;
  }
}
