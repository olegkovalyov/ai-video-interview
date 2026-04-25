import { AggregateRoot } from '../base/base.aggregate-root';
import type { Email } from '../value-objects/email.vo';
import type { FullName } from '../value-objects/full-name.vo';
import { UserStatus } from '../value-objects/user-status.vo';
import { UserRole } from '../value-objects/user-role.vo';
import { UserCreatedEvent } from '../events/user-created.event';
import {
  UserUpdatedEvent,
  type UserProfileChanges,
} from '../events/user-updated.event';
import { UserSuspendedEvent } from '../events/user-suspended.event';
import { UserActivatedEvent } from '../events/user-activated.event';
import { UserDeletedEvent } from '../events/user-deleted.event';
import { DomainException } from '../exceptions/domain.exception';
import {
  UserDeletedException,
  UserSuspendedException,
  InvalidUserOperationException,
} from '../exceptions/user.exceptions';

/**
 * Full state of a {@link User} aggregate. Used by the private constructor
 * and `reconstitute` to restore an aggregate from persistence verbatim.
 */
export interface UserProps {
  id: string;
  externalAuthId: string;
  email: Email;
  fullName: FullName;
  status: UserStatus;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
}

/**
 * Caller-supplied subset for {@link User.create} — defaults are filled in
 * by the factory (status=active, role=pending, timestamps=now, etc).
 */
export interface CreateUserArgs {
  id: string;
  externalAuthId: string;
  email: Email;
  fullName: FullName;
}

/**
 * Optional fields for {@link User.updateProfile}. `fullName` is required
 * because the aggregate's name is never absent.
 */
export interface UpdateUserProfileArgs {
  fullName: FullName;
  bio?: string;
  phone?: string;
  timezone?: string;
  language?: string;
}

/**
 * User Aggregate Root.
 * Central domain model representing a user in the system; enforces
 * business rules and maintains consistency.
 */
export class User extends AggregateRoot {
  private readonly _id: string;
  private readonly _externalAuthId: string;
  private _email: Email;
  private _fullName: FullName;
  private _status: UserStatus;
  private _role: UserRole;
  private _avatarUrl?: string;
  private _bio?: string;
  private _phone?: string;
  private _timezone: string;
  private _language: string;
  private _emailVerified: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _lastLoginAt?: Date;

  private constructor(props: UserProps) {
    super();
    this._id = props.id;
    this._externalAuthId = props.externalAuthId;
    this._email = props.email;
    this._fullName = props.fullName;
    this._status = props.status;
    this._role = props.role;
    this._avatarUrl = props.avatarUrl;
    this._bio = props.bio;
    this._phone = props.phone;
    this._timezone = props.timezone ?? 'UTC';
    this._language = props.language ?? 'en';
    this._emailVerified = props.emailVerified ?? false;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
    this._lastLoginAt = props.lastLoginAt;
  }

  /**
   * Create a new user (factory). Emits {@link UserCreatedEvent}.
   */
  public static create(args: CreateUserArgs): User {
    const user = new User({
      id: args.id,
      externalAuthId: args.externalAuthId,
      email: args.email,
      fullName: args.fullName,
      status: UserStatus.active(),
      role: UserRole.pending(),
    });

    user.apply(
      new UserCreatedEvent({
        userId: user.id,
        email: user.email.value,
        externalAuthId: user.externalAuthId,
        firstName: user.fullName.firstName,
        lastName: user.fullName.lastName,
      }),
    );

    return user;
  }

  /**
   * Reconstitute user from persistence (no events emitted).
   */
  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  /**
   * Update user profile. Emits {@link UserUpdatedEvent} only when at
   * least one field actually changed. Each field is applied through a
   * helper that records the diff in `changes` and skips no-op writes.
   */
  public updateProfile(args: UpdateUserProfileArgs): void {
    this.ensureNotDeleted();
    this.ensureNotSuspended();

    const changes: UserProfileChanges = {};
    this.applyFullNameChange(args.fullName, changes);
    this.applyBioChange(args.bio, changes);
    this.applyPhoneChange(args.phone, changes);
    this.applyTimezoneChange(args.timezone, changes);
    this.applyLanguageChange(args.language, changes);

    if (Object.keys(changes).length > 0) {
      this._updatedAt = new Date();
      this.apply(new UserUpdatedEvent(this._id, changes));
    }
  }

  private applyFullNameChange(
    next: FullName,
    changes: UserProfileChanges,
  ): void {
    if (this._fullName.equals(next)) return;
    this._fullName = next;
    changes.fullName = {
      firstName: next.firstName,
      lastName: next.lastName,
    };
  }

  private applyBioChange(
    next: string | undefined,
    changes: UserProfileChanges,
  ): void {
    if (next === undefined || next === this._bio) return;
    this._bio = next;
    changes.bio = next;
  }

  private applyPhoneChange(
    next: string | undefined,
    changes: UserProfileChanges,
  ): void {
    if (next === undefined || next === this._phone) return;
    this._phone = next;
    changes.phone = next;
  }

  private applyTimezoneChange(
    next: string | undefined,
    changes: UserProfileChanges,
  ): void {
    if (next === undefined || next === this._timezone) return;
    this._timezone = next;
    changes.timezone = next;
  }

  private applyLanguageChange(
    next: string | undefined,
    changes: UserProfileChanges,
  ): void {
    if (next === undefined || next === this._language) return;
    this._language = next;
    changes.language = next;
  }

  /**
   * Change email address. Resets verification and emits event.
   */
  public changeEmail(email: Email): void {
    this.ensureNotDeleted();

    if (this._email.equals(email)) return;

    this._email = email;
    this._emailVerified = false;
    this._updatedAt = new Date();

    this.apply(
      new UserUpdatedEvent(this._id, {
        email: email.value,
        emailVerified: false,
      }),
    );
  }

  public verifyEmail(): void {
    this.ensureNotDeleted();

    if (this._emailVerified) return;

    this._emailVerified = true;
    this._updatedAt = new Date();

    this.apply(new UserUpdatedEvent(this._id, { emailVerified: true }));
  }

  /**
   * Suspend user account. Only active users can be suspended.
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

  public activate(): void {
    this.ensureNotDeleted();

    if (this._status.isActive()) return;

    const previousStatus = this._status.value;
    this._status = UserStatus.active();
    this._updatedAt = new Date();

    this.apply(new UserActivatedEvent(this._id, previousStatus));
  }

  public delete(deletedBy: string): void {
    if (this._status.isDeleted()) return;

    this._status = UserStatus.deleted();
    this._updatedAt = new Date();

    this.apply(new UserDeletedEvent(this._id, deletedBy));
  }

  public uploadAvatar(avatarUrl: string): void {
    this.ensureNotDeleted();
    this.ensureNotSuspended();

    if (!avatarUrl || avatarUrl.trim().length === 0) {
      throw new DomainException('Avatar URL cannot be empty');
    }

    this._avatarUrl = avatarUrl;
    this._updatedAt = new Date();

    this.apply(new UserUpdatedEvent(this._id, { avatarUrl }));
  }

  public removeAvatar(): void {
    this.ensureNotDeleted();
    this.ensureNotSuspended();

    if (!this._avatarUrl) return;

    this._avatarUrl = undefined;
    this._updatedAt = new Date();

    this.apply(new UserUpdatedEvent(this._id, { avatarUrl: null }));
  }

  /**
   * Select user role. Can only be done once — role is immutable after
   * selection.
   */
  public selectRole(role: UserRole): void {
    this.ensureNotDeleted();

    if (!this._role.isPending()) {
      throw new InvalidUserOperationException(
        'Role has already been selected and cannot be changed',
      );
    }

    if (role.isPending()) {
      throw new DomainException('Cannot explicitly select pending role');
    }

    this._role = role;
    this._updatedAt = new Date();

    this.apply(new UserUpdatedEvent(this._id, { role: role.toString() }));
  }

  // ========================================
  // INVARIANTS
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
  // GETTERS
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
