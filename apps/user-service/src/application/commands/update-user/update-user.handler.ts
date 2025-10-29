import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateUserCommand } from './update-user.command';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { FullName } from '../../../domain/value-objects/full-name.vo';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { OutboxService } from '../../../infrastructure/messaging/outbox/outbox.service';
import { v4 as uuid } from 'uuid';

/**
 * Update User Command Handler
 */
@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
    private readonly outboxService: OutboxService,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    // 1. Load user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Update profile
    if (command.firstName && command.lastName) {
      const fullName = FullName.create(command.firstName, command.lastName);
      user.updateProfile(fullName, command.bio, command.phone, command.timezone, command.language);
    } else if (command.bio !== undefined || command.phone !== undefined || command.timezone !== undefined || command.language !== undefined) {
      // Only bio/phone/timezone/language update, keep existing name
      user.updateProfile(user.fullName, command.bio, command.phone, command.timezone, command.language);
    }

    // 3. Save
    await this.userRepository.save(user);

    // 4. Publish domain events (internal only)
    user.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    user.clearEvents();

    // 5. Publish integration event to Kafka (for other services)
    await this.outboxService.saveEvent(
      'user.updated',
      {
        eventId: uuid(),
        eventType: 'user.updated',
        timestamp: Date.now(),
        version: '1.0',
        source: 'user-service',
        payload: {
          userId: user.id,
          keycloakId: user.keycloakId,
          email: user.email.value,
          firstName: user.fullName.firstName,
          lastName: user.fullName.lastName,
          updatedAt: user.updatedAt.toISOString(),
        },
      },
      user.id,
    );

    return user;
  }
}
