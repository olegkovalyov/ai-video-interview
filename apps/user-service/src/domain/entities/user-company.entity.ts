import { DomainException } from '../exceptions/domain.exception';

/**
 * UserCompany Entity
 * Represents a user's association with a company (many-to-many)
 * Belongs to Company aggregate
 */
export class UserCompany {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _companyId: string,
    private _position: string | null,
    private _isPrimary: boolean,
    private readonly _joinedAt: Date,
  ) {}

  // ========================================
  // FACTORY METHODS
  // ========================================

  /**
   * Create new user-company association
   */
  public static create(
    id: string,
    userId: string,
    companyId: string,
    position: string | null,
    isPrimary: boolean,
  ): UserCompany {
    if (!userId || userId.trim().length === 0) {
      throw new DomainException('User ID cannot be empty');
    }

    if (!companyId || companyId.trim().length === 0) {
      throw new DomainException('Company ID cannot be empty');
    }

    // Validate position length
    if (position && position.length > 100) {
      throw new DomainException('Position is too long (max 100 characters)');
    }

    return new UserCompany(
      id,
      userId,
      companyId,
      position?.trim() || null,
      isPrimary,
      new Date(),
    );
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    userId: string,
    companyId: string,
    position: string | null,
    isPrimary: boolean,
    joinedAt: Date,
  ): UserCompany {
    return new UserCompany(
      id,
      userId,
      companyId,
      position,
      isPrimary,
      joinedAt,
    );
  }

  // ========================================
  // BUSINESS LOGIC
  // ========================================

  /**
   * Update user's position in the company
   */
  public updatePosition(position: string): void {
    if (!position || position.trim().length === 0) {
      throw new DomainException('Position cannot be empty');
    }

    if (position.length > 100) {
      throw new DomainException('Position is too long (max 100 characters)');
    }

    this._position = position.trim();
  }

  /**
   * Set as primary company for the user
   */
  public setAsPrimary(): void {
    this._isPrimary = true;
  }

  /**
   * Unset as primary company
   */
  public unsetAsPrimary(): void {
    this._isPrimary = false;
  }

  // ========================================
  // GETTERS
  // ========================================

  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get companyId(): string {
    return this._companyId;
  }

  public get position(): string | null {
    return this._position;
  }

  public get isPrimary(): boolean {
    return this._isPrimary;
  }

  public get joinedAt(): Date {
    return this._joinedAt;
  }
}
