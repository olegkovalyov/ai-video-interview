import { Injectable, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { ICandidateProfileRepository } from '../../domain/repositories/candidate-profile.repository.interface';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { CandidateProfile } from '../../domain/aggregates/candidate-profile.aggregate';
import { UserNotFoundException } from '../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../domain/constants';
import type { IOutboxService } from '../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../interfaces/unit-of-work.interface';
import { LoggerService } from '../../infrastructure/logger/logger.service';
import type { User } from '../../domain/aggregates/user.aggregate';

export type SelectableRole = 'candidate' | 'hr' | 'admin';

export interface SelectRoleInput {
  userId: string;
  role: SelectableRole;
}

/**
 * Application service that owns the "select role" use case.
 * Loads the user, applies role selection (aggregate enforces "pending"
 * invariant), creates a CandidateProfile when role=candidate, and
 * persists the entire transition atomically with the integration event.
 */
@Injectable()
export class RoleSelectionService {
  // 6 deps reflect a multi-aggregate use case (User + CandidateProfile +
  // outbox event), see UserCreationService for rationale.
  // eslint-disable-next-line max-params
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ICandidateProfileRepository')
    private readonly candidateProfileRepository: ICandidateProfileRepository,
    private readonly eventBus: EventBus,
    @Inject('IOutboxService')
    private readonly outboxService: IOutboxService,
    @Inject('IUnitOfWork')
    private readonly unitOfWork: IUnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async select(input: SelectRoleInput): Promise<void> {
    const { userId, role } = input;
    this.logger.info('Selecting role for user', { userId, role });

    const user = await this.loadUser(userId);
    user.selectRole(RoleSelectionService.toUserRole(role));

    const eventId = await this.persistAtomically(user, role);
    this.publishInternalEvents(user);
    await this.outboxService.schedulePublishing([eventId]);

    this.logger.info('Role selected successfully', {
      userId: user.id,
      email: user.email.value,
      role: user.role.toString(),
    });
  }

  private async loadUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return user;
  }

  /**
   * Map the input string union to a {@link UserRole} value object.
   * Default branch is unreachable under the type union but defensive at
   * runtime if a caller bypasses the type.
   */
  private static toUserRole(role: SelectableRole): UserRole {
    switch (role) {
      case 'candidate': {
        return UserRole.candidate();
      }
      case 'hr': {
        return UserRole.hr();
      }
      case 'admin': {
        return UserRole.admin();
      }
      default: {
        throw new Error(`Invalid role: ${String(role)}`);
      }
    }
  }

  private async persistAtomically(
    user: User,
    role: SelectableRole,
  ): Promise<string> {
    return this.unitOfWork.execute(async (tx) => {
      if (role === 'candidate') {
        const profile = CandidateProfile.create(user.id);
        await this.candidateProfileRepository.save(profile, tx);
      }
      await this.userRepository.save(user, tx);
      return this.outboxService.saveEvent(
        USER_EVENT_TYPES.ROLE_SELECTED,
        {
          userId: user.id,
          companyId: user.id,
          externalAuthId: user.externalAuthId,
          email: user.email.value,
          role: user.role.toString(),
          selectedAt: user.updatedAt.toISOString(),
        },
        user.id,
        tx,
      );
    });
  }

  private publishInternalEvents(user: User): void {
    user.getUncommittedEvents().forEach((event) => {
      this.eventBus.publish(event);
    });
    user.clearEvents();
  }
}
