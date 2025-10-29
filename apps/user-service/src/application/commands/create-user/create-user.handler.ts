import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateUserCommand } from './create-user.command';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { Email } from '../../../domain/value-objects/email.vo';
import { FullName } from '../../../domain/value-objects/full-name.vo';
import { UserAlreadyExistsException } from '../../../domain/exceptions/user.exceptions';
import { OutboxService } from '../../../infrastructure/messaging/outbox/outbox.service';
import { v4 as uuid } from 'uuid';

/**
 * Create User Command Handler
 * Orchestrates user creation use case
 */
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
    private readonly outboxService: OutboxService,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    // 1. Check if user already exists
    const existingUser = await this.userRepository.findByKeycloakId(
      command.keycloakId,
    );

    if (existingUser) {
      throw new UserAlreadyExistsException(command.email);
    }

    // Check by email too
    const existingByEmail = await this.userRepository.findByEmail(command.email);
    if (existingByEmail) {
      throw new UserAlreadyExistsException(command.email);
    }

    // 2. Create Value Objects
    const email = Email.create(command.email);
    const fullName = FullName.create(command.firstName, command.lastName);

    // 3. Create Aggregate
    const user = User.create(
      uuid(),
      command.keycloakId,
      email,
      fullName,
    );

    // 4. Save to repository
    await this.userRepository.save(user);

    // 5. Publish domain events (internal only - logging, metrics, etc.)
    user.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    user.clearEvents();

    // 6. Publish integration event to Kafka (for other services)
    await this.outboxService.saveEvent(
      'user.created',
      {
        eventId: uuid(),
        eventType: 'user.created',
        timestamp: Date.now(),
        version: '1.0',
        source: 'user-service',
        payload: {
          userId: user.id,
          keycloakId: user.keycloakId,
          email: user.email.value,
          firstName: user.fullName.firstName,
          lastName: user.fullName.lastName,
          status: user.status.value,
          createdAt: user.createdAt.toISOString(),
        },
      },
      user.id,
    );

    return user;
  }
}
