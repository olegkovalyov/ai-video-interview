import { AggregateRoot } from '../base/base.aggregate-root';
import type { CompanySize } from '../value-objects/company-size.vo';
import { UserCompany } from '../entities/user-company.entity';
import { DomainException } from '../exceptions/domain.exception';
import { CompanyCreatedEvent } from '../events/company-created.event';
import {
  CompanyUpdatedEvent,
  type CompanyChanges,
} from '../events/company-updated.event';
import { CompanyDeactivatedEvent } from '../events/company-deactivated.event';

/**
 * Full state of a {@link Company} aggregate. Used by the private
 * constructor and `reconstitute` to restore from persistence verbatim.
 */
export interface CompanyProps {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  industry: string | null;
  size: CompanySize | null;
  location: string | null;
  isActive: boolean;
  createdBy: string;
  users?: UserCompany[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Caller-supplied subset for {@link Company.create} — defaults are filled
 * by the factory (isActive=true, timestamps=now, the creator becomes the
 * first associated user with isPrimary=true).
 */
export interface CreateCompanyArgs {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  industry: string | null;
  size: CompanySize | null;
  location: string | null;
  createdBy: string;
  userCompanyId: string;
  position: string | null;
}

/**
 * Mutable subset of company fields used by {@link Company.update}.
 */
export interface UpdateCompanyArgs {
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  industry: string | null;
  size: CompanySize | null;
  location: string | null;
}

/**
 * Company Aggregate Root.
 * Created and managed by HR users; can have multiple associated users
 * via the {@link UserCompany} entity (many-to-many).
 */
export class Company extends AggregateRoot {
  private readonly _id: string;
  private _name: string;
  private _description: string | null;
  private _website: string | null;
  private _logoUrl: string | null;
  private _industry: string | null;
  private _size: CompanySize | null;
  private _location: string | null;
  private _isActive: boolean;
  private readonly _createdBy: string;
  private readonly _users: UserCompany[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: CompanyProps) {
    super();
    this._id = props.id;
    this._name = props.name;
    this._description = props.description;
    this._website = props.website;
    this._logoUrl = props.logoUrl;
    this._industry = props.industry;
    this._size = props.size;
    this._location = props.location;
    this._isActive = props.isActive;
    this._createdBy = props.createdBy;
    this._users = props.users ?? [];
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  /**
   * Create new company. Automatically adds the creator as the first
   * associated user with `isPrimary=true`.
   */
  public static create(args: CreateCompanyArgs): Company {
    Company.assertValidName(args.name);
    Company.assertValidCreator(args.createdBy);

    const company = new Company(Company.buildCreateProps(args));

    // Creator becomes the first associated user, marked primary.
    company.addUser({
      userCompanyId: args.userCompanyId,
      userId: args.createdBy,
      position: args.position,
      isPrimary: true,
    });

    company.apply(
      new CompanyCreatedEvent(args.id, args.name.trim(), args.createdBy),
    );

    return company;
  }

  /**
   * Build the {@link CompanyProps} bundle for the constructor — separates
   * field normalisation (trim + empty-as-null) from the orchestration above.
   */
  private static buildCreateProps(args: CreateCompanyArgs): CompanyProps {
    return {
      id: args.id,
      name: args.name.trim(),
      description: Company.normalizeNullableField(args.description),
      website: Company.normalizeNullableField(args.website),
      logoUrl: Company.normalizeNullableField(args.logoUrl),
      industry: Company.normalizeNullableField(args.industry),
      size: args.size,
      location: Company.normalizeNullableField(args.location),
      isActive: true,
      createdBy: args.createdBy,
    };
  }

  private static assertValidName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new DomainException('Company name cannot be empty');
    }
    if (name.length > 255) {
      throw new DomainException(
        'Company name is too long (max 255 characters)',
      );
    }
  }

  private static assertValidCreator(createdBy: string): void {
    if (!createdBy || createdBy.trim().length === 0) {
      throw new DomainException('Creator ID cannot be empty');
    }
  }

  /**
   * Reconstitute from persistence (no events emitted).
   */
  public static reconstitute(props: CompanyProps): Company {
    return new Company(props);
  }

  /**
   * Update company information. Emits {@link CompanyUpdatedEvent} only
   * when at least one field actually changed.
   */
  public update(args: UpdateCompanyArgs): void {
    Company.assertValidName(args.name);

    const changes: CompanyChanges = {};
    this.applyNameChange(args.name, changes);
    this.applyTextField('description', args.description, changes);
    this.applyTextField('website', args.website, changes);
    this.applyTextField('logoUrl', args.logoUrl, changes);
    this.applyTextField('industry', args.industry, changes);
    this.applyTextField('location', args.location, changes);
    this.applySizeChange(args.size, changes);

    if (Object.keys(changes).length > 0) {
      this._updatedAt = new Date();
      this.apply(new CompanyUpdatedEvent(this._id, changes));
    }
  }

  private applyNameChange(name: string, changes: CompanyChanges): void {
    const trimmed = name.trim();
    if (trimmed === this._name) return;
    this._name = trimmed;
    changes.name = trimmed;
  }

  /**
   * Apply an optional nullable text field — normalises whitespace, treats
   * empty as null, writes + records diff iff the result differs from
   * current. `field` is also the storage key of the underlying private
   * member (e.g. 'description' → `this._description`).
   */
  private applyTextField(
    field: 'description' | 'website' | 'logoUrl' | 'industry' | 'location',
    next: string | null,
    changes: CompanyChanges,
  ): void {
    const normalized = Company.normalizeNullableField(next);
    const currentMap: Record<typeof field, string | null> = {
      description: this._description,
      website: this._website,
      logoUrl: this._logoUrl,
      industry: this._industry,
      location: this._location,
    };
    if (normalized === currentMap[field]) return;
    this.writeTextField(field, normalized);
    changes[field] = normalized;
  }

  private writeTextField(
    field: 'description' | 'website' | 'logoUrl' | 'industry' | 'location',
    value: string | null,
  ): void {
    switch (field) {
      case 'description': {
        this._description = value;
        return;
      }
      case 'website': {
        this._website = value;
        return;
      }
      case 'logoUrl': {
        this._logoUrl = value;
        return;
      }
      case 'industry': {
        this._industry = value;
        return;
      }
      case 'location': {
        this._location = value;
        return;
      }
    }
  }

  /**
   * Three-state CompanySize update:
   *   next = null     → clear when current was set
   *   next = some VO  → set when current was null OR not equal
   */
  private applySizeChange(
    next: CompanySize | null,
    changes: CompanyChanges,
  ): void {
    if (next === null) {
      if (this._size === null) return;
      this._size = null;
      changes.size = null;
      return;
    }
    if (this._size && next.equals(this._size)) return;
    this._size = next;
    changes.size = next.value;
  }

  /**
   * Normalize a nullable text field: trim whitespace, treat empty as null.
   */
  private static normalizeNullableField(value: string | null): string | null {
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  /**
   * Add user to company.
   */
  public addUser(args: {
    userCompanyId: string;
    userId: string;
    position: string | null;
    isPrimary: boolean;
  }): void {
    const exists = this._users.some((uc) => uc.userId === args.userId);
    if (exists) {
      throw new DomainException('User already associated with this company');
    }

    if (args.isPrimary) {
      this._users
        .filter((uc) => uc.isPrimary)
        .forEach((uc) => {
          uc.unsetAsPrimary();
        });
    }

    const userCompany = UserCompany.create({
      id: args.userCompanyId,
      userId: args.userId,
      companyId: this._id,
      position: args.position,
      isPrimary: args.isPrimary,
    });

    this._users.push(userCompany);
    this._updatedAt = new Date();
  }

  public removeUser(userId: string): void {
    if (userId === this._createdBy) {
      throw new DomainException('Cannot remove company creator');
    }

    const index = this._users.findIndex((uc) => uc.userId === userId);
    if (index === -1) {
      throw new DomainException('User not found in company');
    }

    this._users.splice(index, 1);
    this._updatedAt = new Date();
  }

  public updateUserPosition(userId: string, position: string): void {
    const userCompany = this._users.find((uc) => uc.userId === userId);
    if (!userCompany) {
      throw new DomainException('User not found in company');
    }

    userCompany.updatePosition(position);
    this._updatedAt = new Date();
  }

  public setUserPrimary(userId: string): void {
    const userCompany = this._users.find((uc) => uc.userId === userId);
    if (!userCompany) {
      throw new DomainException('User not found in company');
    }

    this._users
      .filter((uc) => uc.userId === userId && uc.id !== userCompany.id)
      .forEach((uc) => {
        uc.unsetAsPrimary();
      });

    userCompany.setAsPrimary();
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    if (!this._isActive) return;

    this._isActive = false;
    this._updatedAt = new Date();

    this.apply(new CompanyDeactivatedEvent(this._id));
  }

  public activate(): void {
    if (this._isActive) return;

    this._isActive = true;
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

  public get description(): string | null {
    return this._description;
  }

  public get website(): string | null {
    return this._website;
  }

  public get logoUrl(): string | null {
    return this._logoUrl;
  }

  public get industry(): string | null {
    return this._industry;
  }

  public get size(): CompanySize | null {
    return this._size;
  }

  public get location(): string | null {
    return this._location;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get createdBy(): string {
    return this._createdBy;
  }

  public get users(): readonly UserCompany[] {
    return [...this._users];
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }
}
