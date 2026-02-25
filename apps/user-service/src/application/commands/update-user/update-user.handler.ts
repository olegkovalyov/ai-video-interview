import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateUserCommand } from './update-user.command';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { FullName } from '../../../domain/value-objects/full-name.vo';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../../domain/constants';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';

/**
 * Update User Command Handler
 */
@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
    @Inject('IOutboxService')
    private readonly outboxService: IOutboxService,
    @Inject('IUnitOfWork')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    // 1. Load user by ID (internal ID, not external auth ID)
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Update profile
    if (command.firstName !== undefined || command.lastName !== undefined) {
      const firstName = command.firstName !== undefined ? command.firstName : user.fullName.firstName;
      const lastName = command.lastName !== undefined ? command.lastName : user.fullName.lastName;
      const fullName = FullName.create(firstName, lastName);
      user.updateProfile(fullName, command.bio, command.phone, command.timezone, command.language);
    } else if (command.bio !== undefined || command.phone !== undefined || command.timezone !== undefined || command.language !== undefined) {
      user.updateProfile(user.fullName, command.bio, command.phone, command.timezone, command.language);
    }

    // 3. Atomic save: aggregate + outbox in same transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.userRepository.save(user, tx);
      return this.outboxService.saveEvent(
        USER_EVENT_TYPES.UPDATED,
        {
          userId: user.id,
          externalAuthId: user.externalAuthId,
          email: user.email.value,
          firstName: user.fullName.firstName,
          lastName: user.fullName.lastName,
          role: user.role.toString(),
          updatedAt: user.updatedAt.toISOString(),
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
