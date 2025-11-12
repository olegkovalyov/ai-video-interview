import { DomainException } from '../exceptions/domain.exception';

/**
 * SkillCategory Entity
 * Represents a category grouping related skills
 * Read-only for MVP (managed via seed data)
 */
export class SkillCategory {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _slug: string,
    private readonly _description: string | null,
    private readonly _sortOrder: number,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  // ========================================
  // FACTORY METHODS
  // ========================================

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    name: string,
    slug: string,
    description: string | null,
    sortOrder: number,
    createdAt: Date,
    updatedAt: Date,
  ): SkillCategory {
    return new SkillCategory(
      id,
      name,
      slug,
      description,
      sortOrder,
      createdAt,
      updatedAt,
    );
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

  public get description(): string | null {
    return this._description;
  }

  public get sortOrder(): number {
    return this._sortOrder;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }
}
