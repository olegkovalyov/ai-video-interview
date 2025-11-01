import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { AssignRoleCommand } from './assign-role.command';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IRoleRepository } from '../../../domain/repositories/role.repository.interface';
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
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    private readonly eventBus: EventBus,
    private readonly outboxService: OutboxService,
  ) {}

  async execute(command: AssignRoleCommand): Promise<User> {
    // 1. Load user by external auth ID
    const user = await this.userRepository.findByExternalAuthId(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Find role by name
    const role = await this.roleRepository.findByName(command.roleName);
    if (!role) {
      throw new NotFoundException(`Role not found: ${command.roleName}`);
    }

    // 3. Assign role in database (creates record in user_roles table)
    await this.roleRepository.assignToUser(
      user.id,
      role.id,
      command.assignedBy || 'system',
    );

    // 4. Emit domain event (for event sourcing & consistency)
    user.assignRole(command.roleName, command.assignedBy || 'system');
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
          externalAuthId: user.externalAuthId,
          roleName: command.roleName,
          roleId: role.id,
          assignedBy: command.assignedBy,
          assignedAt: new Date().toISOString(),
        },
      },
      user.id,
    );

    return user;
  }
}
