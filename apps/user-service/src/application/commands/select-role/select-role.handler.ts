import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { SelectRoleCommand } from './select-role.command';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { ICandidateProfileRepository } from '../../../domain/repositories/candidate-profile.repository.interface';
import { UserRole } from '../../../domain/value-objects/user-role.vo';
import { CandidateProfile } from '../../../domain/aggregates/candidate-profile.aggregate';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../../domain/constants';
import type { IOutboxService } from '../../ports/outbox-service.port';
import { LoggerService } from '../../../infrastructure/logger/logger.service';

/**
 * SelectRole Command Handler
 * Handles user role selection and creates corresponding profile
 */
@Injectable()
@CommandHandler(SelectRoleCommand)
export class SelectRoleHandler implements ICommandHandler<SelectRoleCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ICandidateProfileRepository')
    private readonly candidateProfileRepository: ICandidateProfileRepository,
    private readonly eventBus: EventBus,
    @Inject('IOutboxService')
    private readonly outboxService: IOutboxService,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: SelectRoleCommand): Promise<void> {
    const { userId, role } = command;

    this.logger.info('Selecting role for user', { userId, role });

    // 1. Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // 2. Select role (domain validates that role is pending)
    let userRole: UserRole;
    if (role === 'candidate') {
      userRole = UserRole.candidate();
    } else if (role === 'hr') {
      userRole = UserRole.hr();
    } else if (role === 'admin') {
      userRole = UserRole.admin();
    } else {
      throw new Error(`Invalid role: ${role}`);
    }

    user.selectRole(userRole);

    // 3. Create corresponding profile
    if (role === 'candidate') {
      const profile = CandidateProfile.create(userId);
      await this.candidateProfileRepository.save(profile);
    }

    // 4. Save user
    await this.userRepository.save(user);

    // 5. Publish domain events (internal)
    user.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    user.clearEvents();

    this.logger.info('Role selected successfully', {
      userId: user.id,
      email: user.email.value,
      role: user.role.toString(),
    });

    // 6. Publish role selected event to Kafka via outbox
    await this.outboxService.saveEvent(
      USER_EVENT_TYPES.ROLE_SELECTED,
      {
        userId: user.id,
        externalAuthId: user.externalAuthId,
        email: user.email.value,
        role: user.role.toString(),
        selectedAt: user.updatedAt.toISOString(),
      },
      user.id,
    );
  }
}
