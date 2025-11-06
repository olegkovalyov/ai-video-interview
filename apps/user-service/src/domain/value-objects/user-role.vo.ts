import { ValueObject } from '../base/base.value-object';
import { DomainException } from '../exceptions/domain.exception';

/**
 * UserRole Value Object
 * Represents user's role in the system (immutable after selection)
 */
export class UserRole extends ValueObject<{ value: string }> {
  public static readonly PENDING = 'pending';
  public static readonly CANDIDATE = 'candidate';
  public static readonly HR = 'hr';
  public static readonly ADMIN = 'admin';

  private static readonly VALID_ROLES = [
    UserRole.PENDING,
    UserRole.CANDIDATE,
    UserRole.HR,
    UserRole.ADMIN,
  ] as const;

  private constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  /**
   * Create UserRole from string
   */
  public static fromString(role: string): UserRole {
    const normalized = role.toLowerCase().trim();

    if (!this.isValid(normalized)) {
      throw new DomainException(
        `Invalid user role: ${role}. Must be one of: ${this.VALID_ROLES.join(', ')}`,
      );
    }

    return new UserRole(normalized);
  }

  /**
   * Factory methods for each role
   */
  public static pending(): UserRole {
    return new UserRole(UserRole.PENDING);
  }

  public static candidate(): UserRole {
    return new UserRole(UserRole.CANDIDATE);
  }

  public static hr(): UserRole {
    return new UserRole(UserRole.HR);
  }

  public static admin(): UserRole {
    return new UserRole(UserRole.ADMIN);
  }

  /**
   * Validation
   */
  private static isValid(role: string): boolean {
    return this.VALID_ROLES.includes(role as any);
  }

  /**
   * Type guards
   */
  public isPending(): boolean {
    return this.value === UserRole.PENDING;
  }

  public isCandidate(): boolean {
    return this.value === UserRole.CANDIDATE;
  }

  public isHR(): boolean {
    return this.value === UserRole.HR;
  }

  public isAdmin(): boolean {
    return this.value === UserRole.ADMIN;
  }

  /**
   * Check if role has been selected (not pending)
   */
  public isSelected(): boolean {
    return !this.isPending();
  }

  /**
   * Get role name for display
   */
  public getDisplayName(): string {
    const displayNames: Record<string, string> = {
      [UserRole.PENDING]: 'Pending',
      [UserRole.CANDIDATE]: 'Candidate',
      [UserRole.HR]: 'HR Manager',
      [UserRole.ADMIN]: 'Administrator',
    };

    return displayNames[this.value] || this.value;
  }

  /**
   * Equality check
   */
  public equals(other: UserRole): boolean {
    if (!(other instanceof UserRole)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * String representation
   */
  public toString(): string {
    return this.value;
  }
}
