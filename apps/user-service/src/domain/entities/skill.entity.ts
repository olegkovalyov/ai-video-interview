import { DomainException } from '../exceptions/domain.exception';

/**
 * Full state of a {@link Skill} — used both by `reconstitute` (loading from
 * persistence) and the private constructor.
 */
export interface SkillProps {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User-supplied subset for {@link Skill.create}: id is generated outside,
 * timestamps and `isActive` are set by the factory.
 */
export interface CreateSkillArgs {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  description: string | null;
}

/**
 * Skill Entity
 * Represents a skill in the system (managed by Admin)
 */
export class Skill {
  private readonly _id: string;
  private _name: string;
  private _slug: string;
  private _categoryId: string | null;
  private _description: string | null;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: SkillProps) {
    this._id = props.id;
    this._name = props.name;
    this._slug = props.slug;
    this._categoryId = props.categoryId;
    this._description = props.description;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Create new skill (Admin only). Active by default.
   */
  public static create(args: CreateSkillArgs): Skill {
    if (!args.name || args.name.trim().length === 0) {
      throw new DomainException('Skill name cannot be empty');
    }

    if (args.name.length > 100) {
      throw new DomainException('Skill name is too long (max 100 characters)');
    }

    if (!args.slug || args.slug.trim().length === 0) {
      throw new DomainException('Skill slug cannot be empty');
    }

    const now = new Date();
    return new Skill({
      id: args.id,
      name: args.name.trim(),
      slug: args.slug.trim(),
      categoryId: args.categoryId,
      description: args.description?.trim() || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from persistence.
   */
  public static reconstitute(props: SkillProps): Skill {
    return new Skill(props);
  }

  /**
   * Update skill information.
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

  public activate(): void {
    if (this._isActive) return;
    this._isActive = true;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    if (!this._isActive) return;
    this._isActive = false;
    this._updatedAt = new Date();
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
