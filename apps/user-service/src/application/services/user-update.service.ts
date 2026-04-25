import { Injectable, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { User } from '../../domain/aggregates/user.aggregate';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { FullName } from '../../domain/value-objects/full-name.vo';
import { UserNotFoundException } from '../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../domain/constants';
import type { IOutboxService } from '../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../interfaces/unit-of-work.interface';
import { LoggerService } from '../../infrastructure/logger/logger.service';

/**
 * Caller-supplied data for {@link UserUpdateService.update}.
 * All fields except `userId` are optional — undefined means "leave as is".
 */
export interface UpdateUserInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  timezone?: string;
  language?: string;
}

/**
 * Application service that owns the "update user profile" use case.
 *
 * Counterpart to {@link UserCreationService} — same atomic-save +
 * outbox-publish flow, with the wrinkle that name fields are partial:
 * a caller may set firstName alone and expect lastName to be preserved.
 *
 * Extracted from the original `UpdateUserHandler` so the handler becomes
 * a thin CQRS adapter and the use case is reusable beyond CQRS.
 */
@Injectable()
export class UserUpdateService {
  // 5 deps reflect the actual scope of the use case — see the matching
  // note in UserCreationService for the rationale.
  // eslint-disable-next-line max-params
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
    @Inject('IOutboxService')
    private readonly outboxService: IOutboxService,
    @Inject('IUnitOfWork')
    private readonly unitOfWork: IUnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async update(input: UpdateUserInput): Promise<User> {
    this.logger.info('Updating user profile', { userId: input.userId });

    const user = await this.loadUser(input.userId);
    UserUpdateService.applyProfileChanges(user, input);

    const eventId = await this.persistAtomically(user);
    this.publishInternalEvents(user);
    await this.outboxService.schedulePublishing([eventId]);

    return user;
  }

  private async loadUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return user;
  }

  /**
   * Forward the partial update to the aggregate. Name fields default to
   * the current value when only one of firstName/lastName is supplied,
   * preserving the existing FullName when both are absent.
   */
  private static applyProfileChanges(user: User, input: UpdateUserInput): void {
    const hasNameChange =
      input.firstName !== undefined || input.lastName !== undefined;
    const hasOtherChange =
      input.bio !== undefined ||
      input.phone !== undefined ||
      input.timezone !== undefined ||
      input.language !== undefined;
    if (!hasNameChange && !hasOtherChange) return;

    const fullName = hasNameChange
      ? FullName.create(
          input.firstName ?? user.fullName.firstName,
          input.lastName ?? user.fullName.lastName,
        )
      : user.fullName;

    user.updateProfile({
      fullName,
      bio: input.bio,
      phone: input.phone,
      timezone: input.timezone,
      language: input.language,
    });
  }

  private async persistAtomically(user: User): Promise<string> {
    return this.unitOfWork.execute(async (tx) => {
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
  }

  private publishInternalEvents(user: User): void {
    user.getUncommittedEvents().forEach((event) => {
      this.eventBus.publish(event);
    });
    user.clearEvents();
  }
}
