import { AggregateRoot } from '../base/base.aggregate-root';
import { Email } from '../value-objects/email.vo';
import { FullName } from '../value-objects/full-name.vo';
import { UserStatus } from '../value-objects/user-status.vo';
import { UserRole } from '../value-objects/user-role.vo';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserUpdatedEvent } from '../events/user-updated.event';
import { UserSuspendedEvent } from '../events/user-suspended.event';
import { UserDeletedEvent } from '../events/user-deleted.event';
import { DomainException } from '../exceptions/domain.exception';
import {
  UserDeletedException,
  UserSuspendedException,
  InvalidUserOperationException,
} from '../exceptions/user.exceptions';

/**
 * User Aggregate Root
 * Central domain model representing a user in the system
 * Enforces business rules and maintains consistency
 */
export class User extends AggregateRoot {
  private constructor(
    private readonly _id: string,
    private readonly _externalAuthId: string,
    private _email: Email,
    private _fullName: FullName,
    private _status: UserStatus,
    private _role: UserRole,
    private _avatarUrl?: string,
    private _bio?: string,
    private _phone?: string,
    private _timezone: string = 'UTC',
    private _language: string = 'en',
    private _emailVerified: boolean = false,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
    private _lastLoginAt?: Date,
  ) {
    super();
  }

  // ========================================
  // FACTORY METHODS
  // ========================================

  /**
   * Create a new user (factory method)
   * Emits UserCreatedEvent
   */
  public static create(
    id: string,
    externalAuthId: string,
    email: Email,
    fullName: FullName,
  ): User {
    const user = new User(
      id,
      externalAuthId,
      email,
      fullName,
      UserStatus.active(),
      UserRole.pending(), // New users start with pending role
      undefined,
      undefined,
      undefined,
      'UTC',
      'en',
      false,
      new Date(),
      new Date(),
    );

    // Domain Event: User created
    user.apply(
      new UserCreatedEvent(
        user.id,
        user.email.value,
        user.externalAuthId,
        user.fullName.firstName,
        user.fullName.lastName,
      ),
    );

    return user;
  }

  /**
   * Reconstitute user from persistence (no events emitted)
   * Used by repository to rebuild aggregate from database
   */
  public static reconstitute(
    id: string,
    externalAuthId: string,
    email: Email,
    fullName: FullName,
    status: UserStatus,
    role: UserRole,
    avatarUrl?: string,
    bio?: string,
    phone?: string,
    timezone?: string,
    language?: string,
    emailVerified?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
    lastLoginAt?: Date,
  ): User {
    return new User(
      id,
      externalAuthId,
      email,
      fullName,
      status,
      role,
      avatarUrl,
      bio,
      phone,
      timezone || 'UTC',
      language || 'en',
      emailVerified,
      createdAt,
      updatedAt,
      lastLoginAt,
    );
  }

  // ========================================
  // BUSINESS LOGIC (Domain Methods)
  // ========================================

  /**
   * Update user profile
   * Validates state and emits UserUpdatedEvent
   */
  public updateProfile(
    fullName: FullName,
    bio?: string,
    phone?: string,
    timezone?: string,
    language?: string,
  ): void {
    this.ensureNotDeleted();
    this.ensureNotSuspended();

    const changes: any = {};

    if (!this._fullName.equals(fullName)) {
      this._fullName = fullName;
      changes.fullName = {
        firstName: fullName.firstName,
        lastName: fullName.lastName,
      };
    }

    if (bio !== undefined && bio !== this._bio) {
      this._bio = bio;
      changes.bio = bio;
    }

    if (phone !== undefined && phone !== this._phone) {
      this._phone = phone;
      changes.phone = phone;
    }

    if (timezone !== undefined && timezone !== this._timezone) {
      this._timezone = timezone;
      changes.timezone = timezone;
    }

    if (language !== undefined && language !== this._language) {
      this._language = language;
      changes.language = language;
    }

    if (Object.keys(changes).length > 0) {
      this._updatedAt = new Date();
      this.apply(new UserUpdatedEvent(this._id, changes));
    }
  }

  /**
   * Change email address
   * Resets email verification and emits UserUpdatedEvent
   */
  public changeEmail(email: Email): void {
    this.ensureNotDeleted();

    if (this._email.equals(email)) {
      return; // No change needed
    }

    this._email = email;
    this._emailVerified = false; // Reset verification when email changes
    this._updatedAt = new Date();

    this.apply(
      new UserUpdatedEvent(this._id, {
        email: email.value,
        emailVerified: false,
      }),
    );
  }

  /**
   * Mark email as verified
   */
  public verifyEmail(): void {
    this.ensureNotDeleted();

    if (this._emailVerified) {
      return; // Already verified
    }

    this._emailVerified = true;
    this._updatedAt = new Date();

    this.apply(
      new UserUpdatedEvent(this._id, {
        emailVerified: true,
      }),
    );
  }

  /**
   * Suspend user account
   * Only active users can be suspended
   * Emits UserSuspendedEvent
   */
  public suspend(reason: string, suspendedBy: string): void {
    this.ensureNotDeleted();

    if (this._status.isSuspended()) {
      throw new InvalidUserOperationException('User is already suspended');
    }

    this._status = UserStatus.suspended();
    this._updatedAt = new Date();

    this.apply(new UserSuspendedEvent(this._id, reason, suspendedBy));
  }

  /**
   * Activate user account
   * Can reactivate suspended users
   */
  public activate(): void {
    this.ensureNotDeleted();

    if (this._status.isActive()) {
      return; // Already active
    }

    this._status = UserStatus.active();
    this._updatedAt = new Date();

    this.apply(
      new UserUpdatedEvent(this._id, {
        status: 'active',
      }),
    );
  }

  /**
   * Delete user (hard delete)
   * Emits UserDeletedEvent
   * Actual deletion from DB happens in repository
   */
  public delete(deletedBy: string): void {
    if (this._status.isDeleted()) {
      return; // Already deleted
    }

    this._status = UserStatus.deleted();
    this._updatedAt = new Date();

    this.apply(new UserDeletedEvent(this._id, deletedBy));
  }

  /**
   * Upload avatar
   * Updates avatar URL and emits event
   */
  public uploadAvatar(avatarUrl: string): void {
    this.ensureNotDeleted();
    this.ensureNotSuspended();

    if (!avatarUrl || avatarUrl.trim().length === 0) {
      throw new DomainException('Avatar URL cannot be empty');
    }

    this._avatarUrl = avatarUrl;
    this._updatedAt = new Date();

    this.apply(
      new UserUpdatedEvent(this._id, {
        avatarUrl,
      }),
    );
  }

  /**
   * Remove avatar
   */
  public removeAvatar(): void {
    this.ensureNotDeleted();
    this.ensureNotSuspended();

    if (!this._avatarUrl) {
      return; // No avatar to remove
    }

    this._avatarUrl = undefined;
    this._updatedAt = new Date();

    this.apply(
      new UserUpdatedEvent(this._id, {
        avatarUrl: null,
      }),
    );
  }

  /**
   * Select user role (can only be done once!)
   * Validates that role is pending before selection
   * Role is immutable after selection
   */
  public selectRole(role: UserRole): void {
    this.ensureNotDeleted();

    // Can only select role if currently pending
    if (!this._role.isPending()) {
      throw new InvalidUserOperationException(
        'Role has already been selected and cannot be changed'
      );
    }

    // Cannot select pending as a role
    if (role.isPending()) {
      throw new DomainException('Cannot explicitly select pending role');
    }

    this._role = role;
    this._updatedAt = new Date();

    this.apply(
      new UserUpdatedEvent(this._id, {
        role: role.toString(),
      }),
    );
  }

  // ========================================
  // INVARIANTS (Business Rules Protection)
  // ========================================

  private ensureNotDeleted(): void {
    if (this._status.isDeleted()) {
      throw new UserDeletedException(this._id);
    }
  }

  private ensureNotSuspended(): void {
    if (this._status.isSuspended()) {
      throw new UserSuspendedException(this._id);
    }
  }

  // ========================================
  // GETTERS (No setters - immutability!)
  // ========================================

  public get id(): string {
    return this._id;
  }

  public get externalAuthId(): string {
    return this._externalAuthId;
  }

  public get email(): Email {
    return this._email;
  }

  public get fullName(): FullName {
    return this._fullName;
  }

  public get status(): UserStatus {
    return this._status;
  }

  public get avatarUrl(): string | undefined {
    return this._avatarUrl;
  }

  public get bio(): string | undefined {
    return this._bio;
  }

  public get phone(): string | undefined {
    return this._phone;
  }

  public get timezone(): string {
    return this._timezone;
  }

  public get language(): string {
    return this._language;
  }

  public get emailVerified(): boolean {
    return this._emailVerified;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  // Convenience getters
  public get isActive(): boolean {
    return this._status.isActive();
  }

  public get isSuspended(): boolean {
    return this._status.isSuspended();
  }

  public get isDeleted(): boolean {
    return this._status.isDeleted();
  }

  public get role(): UserRole {
    return this._role;
  }

  // Role type guards
  public get isPendingRole(): boolean {
    return this._role.isPending();
  }

  public get isCandidateRole(): boolean {
    return this._role.isCandidate();
  }

  public get isHRRole(): boolean {
    return this._role.isHR();
  }

  public get isAdminRole(): boolean {
    return this._role.isAdmin();
  }
}
