import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { SelectRoleCommand } from './select-role.command';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { ICandidateProfileRepository } from '../../../domain/repositories/candidate-profile.repository.interface';
import type { IHRProfileRepository } from '../../../domain/repositories/hr-profile.repository.interface';
import { UserRole } from '../../../domain/value-objects/user-role.vo';
import { CandidateProfile } from '../../../domain/aggregates/candidate-profile.aggregate';
import { HRProfile } from '../../../domain/aggregates/hr-profile.aggregate';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { OutboxService } from '../../../infrastructure/messaging/outbox/outbox.service';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { v4 as uuid } from 'uuid';

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
    @Inject('IHRProfileRepository')
    private readonly hrProfileRepository: IHRProfileRepository,
    private readonly outboxService: OutboxService,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: SelectRoleCommand): Promise<void> {
    const { userId, role } = command;

    this.logger.info('Selecting role for user', {
      userId,
      role,
    });

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

    // 3. Create corresponding profile (admin doesn't have a profile)
    if (role === 'candidate') {
      const profile = CandidateProfile.create(userId);
      await this.candidateProfileRepository.save(profile);
    } else if (role === 'hr') {
      const profile = HRProfile.create(userId);
      await this.hrProfileRepository.save(profile);
    }
    // Admin role doesn't create a profile

    // 4. Save user (updates role field)
    await this.userRepository.save(user);

    this.logger.info('Role selected successfully', {
      userId: user.id,
      email: user.email.value,
      role: user.role.toString(),
    });

    // 5. Publish role selected event to Kafka via outbox
    await this.outboxService.saveEvent(
      'user.role-selected',
      {
        eventId: uuid(),
        eventType: 'user.role-selected',
        timestamp: Date.now(),
        version: '1.0',
        source: 'user-service',
        payload: {
          userId: user.id,
          externalAuthId: user.externalAuthId,
          email: user.email.value,
          role: user.role.toString(),
          selectedAt: user.updatedAt.toISOString(),
        },
      },
      user.id,
    );
  }
}
