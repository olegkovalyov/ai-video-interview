import { AggregateRoot } from '../base/base.aggregate-root';
import { CompanySize } from '../value-objects/company-size.vo';
import { UserCompany } from '../entities/user-company.entity';
import { DomainException } from '../exceptions/domain.exception';
import { CompanyCreatedEvent } from '../events/company-created.event';
import { CompanyUpdatedEvent, type CompanyChanges } from '../events/company-updated.event';
import { CompanyDeactivatedEvent } from '../events/company-deactivated.event';

/**
 * Company Aggregate Root
 * Represents a company in the system
 * Created and managed by HR users
 * Can have multiple users associated (many-to-many via UserCompany)
 */
export class Company extends AggregateRoot {
  private constructor(
    private readonly _id: string,
    private _name: string,
    private _description: string | null,
    private _website: string | null,
    private _logoUrl: string | null,
    private _industry: string | null,
    private _size: CompanySize | null,
    private _location: string | null,
    private _isActive: boolean,
    private readonly _createdBy: string,
    private _users: UserCompany[] = [],
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {
    super();
  }

  // ========================================
  // FACTORY METHODS
  // ========================================

  /**
   * Create new company
   * Automatically adds creator as first user with isPrimary=true
   */
  public static create(
    id: string,
    name: string,
    description: string | null,
    website: string | null,
    logoUrl: string | null,
    industry: string | null,
    size: CompanySize | null,
    location: string | null,
    createdBy: string,
    userCompanyId: string,
    position: string | null,
  ): Company {
    if (!name || name.trim().length === 0) {
      throw new DomainException('Company name cannot be empty');
    }

    if (name.length > 255) {
      throw new DomainException('Company name is too long (max 255 characters)');
    }

    if (!createdBy || createdBy.trim().length === 0) {
      throw new DomainException('Creator ID cannot be empty');
    }

    const company = new Company(
      id,
      name.trim(),
      description?.trim() || null,
      website?.trim() || null,
      logoUrl?.trim() || null,
      industry?.trim() || null,
      size,
      location?.trim() || null,
      true, // Active by default
      createdBy,
      [],
      new Date(),
      new Date(),
    );

    // Automatically add creator as first user with isPrimary=true
    company.addUser(userCompanyId, createdBy, position, true);

    // Publish domain event
    company.apply(
      new CompanyCreatedEvent(
        id,
        name.trim(),
        createdBy,
      ),
    );

    return company;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    name: string,
    description: string | null,
    website: string | null,
    logoUrl: string | null,
    industry: string | null,
    size: CompanySize | null,
    location: string | null,
    isActive: boolean,
    createdBy: string,
    users: UserCompany[],
    createdAt: Date,
    updatedAt: Date,
  ): Company {
    return new Company(
      id,
      name,
      description,
      website,
      logoUrl,
      industry,
      size,
      location,
      isActive,
      createdBy,
      users,
      createdAt,
      updatedAt,
    );
  }

  // ========================================
  // BUSINESS LOGIC
  // ========================================

  /**
   * Update company information
   */
  public update(
    name: string,
    description: string | null,
    website: string | null,
    logoUrl: string | null,
    industry: string | null,
    size: CompanySize | null,
    location: string | null,
  ): void {
    if (!name || name.trim().length === 0) {
      throw new DomainException('Company name cannot be empty');
    }

    if (name.length > 255) {
      throw new DomainException('Company name is too long (max 255 characters)');
    }

    const changes: CompanyChanges = {};

    if (name.trim() !== this._name) {
      this._name = name.trim();
      changes.name = this._name;
    }

    if (description?.trim() !== this._description) {
      this._description = description?.trim() || null;
      changes.description = this._description;
    }

    if (website?.trim() !== this._website) {
      this._website = website?.trim() || null;
      changes.website = this._website;
    }

    if (logoUrl?.trim() !== this._logoUrl) {
      this._logoUrl = logoUrl?.trim() || null;
      changes.logoUrl = this._logoUrl;
    }

    if (industry?.trim() !== this._industry) {
      this._industry = industry?.trim() || null;
      changes.industry = this._industry;
    }

    // Handle size change (including setting to null)
    if (size === null && this._size !== null) {
      // Remove size
      this._size = null;
      changes.size = null;
    } else if (size && (!this._size || !size.equals(this._size))) {
      // Update size
      this._size = size;
      changes.size = size.value;
    }

    if (location?.trim() !== this._location) {
      this._location = location?.trim() || null;
      changes.location = this._location;
    }

    if (Object.keys(changes).length > 0) {
      this._updatedAt = new Date();
      
      this.apply(
        new CompanyUpdatedEvent(
          this._id,
          changes,
        ),
      );
    }
  }

  /**
   * Add user to company
   */
  public addUser(
    userCompanyId: string,
    userId: string,
    position: string | null,
    isPrimary: boolean,
  ): void {
    // Check if user already associated
    const exists = this._users.some(uc => uc.userId === userId);
    if (exists) {
      throw new DomainException('User already associated with this company');
    }

    // If setting as primary, unset other primary users
    if (isPrimary) {
      this._users
        .filter(uc => uc.isPrimary)
        .forEach(uc => uc.unsetAsPrimary());
    }

    const userCompany = UserCompany.create(
      userCompanyId,
      userId,
      this._id,
      position,
      isPrimary,
    );

    this._users.push(userCompany);
    this._updatedAt = new Date();
  }

  /**
   * Remove user from company
   */
  public removeUser(userId: string): void {
    // Cannot remove creator
    if (userId === this._createdBy) {
      throw new DomainException('Cannot remove company creator');
    }

    const index = this._users.findIndex(uc => uc.userId === userId);
    if (index === -1) {
      throw new DomainException('User not found in company');
    }

    this._users.splice(index, 1);
    this._updatedAt = new Date();
  }

  /**
   * Update user's position in company
   */
  public updateUserPosition(userId: string, position: string): void {
    const userCompany = this._users.find(uc => uc.userId === userId);
    if (!userCompany) {
      throw new DomainException('User not found in company');
    }

    userCompany.updatePosition(position);
    this._updatedAt = new Date();
  }

  /**
   * Set user's company as primary
   */
  public setUserPrimary(userId: string): void {
    const userCompany = this._users.find(uc => uc.userId === userId);
    if (!userCompany) {
      throw new DomainException('User not found in company');
    }

    // Unset other primary for this user
    this._users
      .filter(uc => uc.userId === userId && uc.id !== userCompany.id)
      .forEach(uc => uc.unsetAsPrimary());

    userCompany.setAsPrimary();
    this._updatedAt = new Date();
  }

  /**
   * Deactivate company
   */
  public deactivate(): void {
    if (!this._isActive) {
      return; // Already inactive
    }

    this._isActive = false;
    this._updatedAt = new Date();

    this.apply(
      new CompanyDeactivatedEvent(this._id),
    );
  }

  /**
   * Activate company
   */
  public activate(): void {
    if (this._isActive) {
      return; // Already active
    }

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
    return this._users;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }
}
