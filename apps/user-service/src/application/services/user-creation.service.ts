import { Injectable, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { User } from '../../domain/aggregates/user.aggregate';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { Email } from '../../domain/value-objects/email.vo';
import { FullName } from '../../domain/value-objects/full-name.vo';
import { UserAlreadyExistsException } from '../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../domain/constants';
import type { IOutboxService } from '../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../interfaces/unit-of-work.interface';
import { LoggerService } from '../../infrastructure/logger/logger.service';

/**
 * Caller-supplied data for {@link UserCreationService.create}.
 * Mirrors {@link CreateUserCommand} but is decoupled from CQRS, so the
 * service can be reused by other entry points (batch import, test
 * fixtures, signup-via-invite, etc).
 */
export interface CreateUserInput {
  userId: string;
  externalAuthId: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Application service that owns the "create new user" use case.
 *
 * Responsibilities:
 * - Enforce uniqueness invariants (email, externalAuthId).
 * - Build the {@link User} aggregate via its factory.
 * - Persist atomically via UnitOfWork (aggregate + outbox in one tx).
 * - Publish internal domain events after commit.
 * - Schedule the integration event for Kafka publishing.
 *
 * Extracted from {@link CreateUserHandler} to (a) make the use case
 * reusable beyond CQRS, (b) make the handler trivially testable, and
 * (c) bring the constructor under the 4-dep cap on the handler side.
 */
@Injectable()
export class UserCreationService {
  // 5 deps reflect the actual scope of the use case: repository (uniqueness
  // check + persistence), event bus (internal events), outbox + unit-of-work
  // (transactional integration event), logger (observability). Bundling
  // outbox+eventBus into a façade was considered and rejected — it would
  // hide the seams without reducing real coupling. If a 2nd service emerges
  // with the same combination, revisit and extract an `EventPublisher` port.
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

  async create(input: CreateUserInput): Promise<User> {
    this.logger.info('Creating new user', {
      email: input.email,
      externalAuthId: input.externalAuthId,
      userId: input.userId,
    });

    await this.assertUniqueAuthIdAndEmail(input.externalAuthId, input.email);

    const user = User.create({
      id: input.userId,
      externalAuthId: input.externalAuthId,
      email: Email.create(input.email),
      fullName: FullName.create(input.firstName, input.lastName),
    });

    const eventId = await this.persistAtomically(user);

    this.publishInternalEvents(user);

    await this.outboxService.schedulePublishing([eventId]);

    this.logger.info('User created successfully', {
      userId: user.id,
      email: user.email.value,
      role: user.role.toString(),
      status: user.status.value,
    });

    return user;
  }

  /**
   * Enforce that no user already exists with the given external auth ID
   * or email. Both checks raise {@link UserAlreadyExistsException} —
   * intentionally surfacing the same exception so the caller doesn't
   * have to differentiate auth-provider conflicts from email conflicts.
   */
  private async assertUniqueAuthIdAndEmail(
    externalAuthId: string,
    email: string,
  ): Promise<void> {
    const byAuthId =
      await this.userRepository.findByExternalAuthId(externalAuthId);
    if (byAuthId) {
      throw new UserAlreadyExistsException(email);
    }

    const byEmail = await this.userRepository.findByEmail(email);
    if (byEmail) {
      throw new UserAlreadyExistsException(email);
    }
  }

  /**
   * Persist the aggregate and the integration event in a single
   * transaction. Returns the outbox event ID so the caller can schedule
   * Kafka publishing after the transaction commits.
   */
  private async persistAtomically(user: User): Promise<string> {
    return this.unitOfWork.execute(async (tx) => {
      await this.userRepository.save(user, tx);
      return this.outboxService.saveEvent(
        USER_EVENT_TYPES.CREATED,
        {
          userId: user.id,
          companyId: user.id,
          externalAuthId: user.externalAuthId,
          email: user.email.value,
          firstName: user.fullName.firstName,
          lastName: user.fullName.lastName,
          status: user.status.value,
          role: user.role.toString(),
          createdAt: user.createdAt.toISOString(),
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
