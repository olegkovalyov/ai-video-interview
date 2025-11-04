import { AggregateRoot } from '../base/base.aggregate-root';
import { DomainException } from '../exceptions/domain.exception';

/**
 * HRProfile Aggregate Root
 * Represents HR-specific profile information
 * Linked 1:1 with User (where user.role = 'hr')
 */
export class HRProfile extends AggregateRoot {
  private constructor(
    private readonly _userId: string,
    private _companyName: string | null,
    private _position: string | null,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {
    super();
  }

  // ========================================
  // FACTORY METHODS
  // ========================================

  /**
   * Create new HR profile with default (empty) values
   */
  public static create(userId: string): HRProfile {
    if (!userId || userId.trim().length === 0) {
      throw new DomainException('User ID cannot be empty');
    }

    return new HRProfile(
      userId,
      null, // No company name
      null, // No position
      new Date(),
      new Date(),
    );
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    userId: string,
    companyName: string | null,
    position: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): HRProfile {
    return new HRProfile(
      userId,
      companyName,
      position,
      createdAt,
      updatedAt,
    );
  }

  // ========================================
  // BUSINESS LOGIC
  // ========================================

  /**
   * Update company name
   */
  public updateCompanyName(companyName: string): void {
    const cleaned = companyName.trim();

    if (cleaned.length === 0) {
      throw new DomainException('Company name cannot be empty');
    }

    if (cleaned.length > 255) {
      throw new DomainException('Company name is too long (max 255 characters)');
    }

    this._companyName = cleaned;
    this._updatedAt = new Date();
  }

  /**
   * Update position
   */
  public updatePosition(position: string): void {
    const cleaned = position.trim();

    if (cleaned.length === 0) {
      throw new DomainException('Position cannot be empty');
    }

    if (cleaned.length > 255) {
      throw new DomainException('Position is too long (max 255 characters)');
    }

    this._position = cleaned;
    this._updatedAt = new Date();
  }

  /**
   * Update profile (company and position together)
   */
  public updateProfile(companyName: string, position: string): void {
    this.updateCompanyName(companyName);
    this.updatePosition(position);
  }

  /**
   * Check if profile is complete
   */
  public isComplete(): boolean {
    return this._companyName !== null && this._position !== null;
  }

  /**
   * Get completion percentage
   */
  public getCompletionPercentage(): number {
    let completed = 0;
    const total = 2; // company and position

    if (this._companyName !== null) completed++;
    if (this._position !== null) completed++;

    return Math.round((completed / total) * 100);
  }

  // ========================================
  // GETTERS
  // ========================================

  public get userId(): string {
    return this._userId;
  }

  public get companyName(): string | null {
    return this._companyName;
  }

  public get position(): string | null {
    return this._position;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }
}
