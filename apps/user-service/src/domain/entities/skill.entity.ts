import { DomainException } from '../exceptions/domain.exception';

/**
 * Skill Entity
 * Represents a skill in the system (managed by Admin)
 */
export class Skill {
  private constructor(
    private readonly _id: string,
    private _name: string,
    private _slug: string,
    private _categoryId: string | null,
    private _description: string | null,
    private _isActive: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // ========================================
  // FACTORY METHODS
  // ========================================

  /**
   * Create new skill (Admin only)
   */
  public static create(
    id: string,
    name: string,
    slug: string,
    categoryId: string | null,
    description: string | null,
  ): Skill {
    if (!name || name.trim().length === 0) {
      throw new DomainException('Skill name cannot be empty');
    }

    if (name.length > 100) {
      throw new DomainException('Skill name is too long (max 100 characters)');
    }

    if (!slug || slug.trim().length === 0) {
      throw new DomainException('Skill slug cannot be empty');
    }

    return new Skill(
      id,
      name.trim(),
      slug.trim(),
      categoryId,
      description?.trim() || null,
      true, // Active by default
      new Date(),
      new Date(),
    );
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    name: string,
    slug: string,
    categoryId: string | null,
    description: string | null,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ): Skill {
    return new Skill(
      id,
      name,
      slug,
      categoryId,
      description,
      isActive,
      createdAt,
      updatedAt,
    );
  }

  // ========================================
  // BUSINESS LOGIC
  // ========================================

  /**
   * Update skill information
   */
  public update(
    name: string,
    description: string | null,
    categoryId: string | null,
  ): void {
    if (!name || name.trim().length === 0) {
      throw new DomainException('Skill name cannot be empty');
    }

    if (name.length > 100) {
      throw new DomainException('Skill name is too long (max 100 characters)');
    }

    this._name = name.trim();
    this._description = description?.trim() || null;
    this._categoryId = categoryId;
    this._updatedAt = new Date();
  }

  /**
   * Activate skill
   */
  public activate(): void {
    if (this._isActive) {
      return; // Already active
    }

    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Deactivate skill
   */
  public deactivate(): void {
    if (!this._isActive) {
      return; // Already inactive
    }

    this._isActive = false;
    this._updatedAt = new Date();
  }

  // ========================================
  // GETTERS
  // ========================================

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get slug(): string {
    return this._slug;
  }

  public get categoryId(): string | null {
    return this._categoryId;
  }

  public get description(): string | null {
    return this._description;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }
}
