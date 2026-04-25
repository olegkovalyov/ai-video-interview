/**
 * Construction args for {@link SkillCategory.reconstitute}.
 */
export interface SkillCategoryProps {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SkillCategory Entity
 * Represents a category grouping related skills.
 * Read-only for MVP (managed via seed data).
 */
export class SkillCategory {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _slug: string;
  private readonly _description: string | null;
  private readonly _sortOrder: number;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  private constructor(props: SkillCategoryProps) {
    this._id = props.id;
    this._name = props.name;
    this._slug = props.slug;
    this._description = props.description;
    this._sortOrder = props.sortOrder;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Reconstitute from persistence.
   */
  public static reconstitute(props: SkillCategoryProps): SkillCategory {
    return new SkillCategory(props);
  }

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
