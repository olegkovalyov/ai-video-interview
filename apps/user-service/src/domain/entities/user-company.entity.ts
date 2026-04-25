import { DomainException } from '../exceptions/domain.exception';

/**
 * Full state of a {@link UserCompany}.
 */
export interface UserCompanyProps {
  id: string;
  userId: string;
  companyId: string;
  position: string | null;
  isPrimary: boolean;
  joinedAt: Date;
}

export interface CreateUserCompanyArgs {
  id: string;
  userId: string;
  companyId: string;
  position: string | null;
  isPrimary: boolean;
}

/**
 * UserCompany Entity
 * Represents a user's association with a company (many-to-many).
 * Belongs to Company aggregate.
 */
export class UserCompany {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _companyId: string;
  private _position: string | null;
  private _isPrimary: boolean;
  private readonly _joinedAt: Date;

  private constructor(props: UserCompanyProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._companyId = props.companyId;
    this._position = props.position;
    this._isPrimary = props.isPrimary;
    this._joinedAt = props.joinedAt;
  }

  public static create(args: CreateUserCompanyArgs): UserCompany {
    if (!args.userId || args.userId.trim().length === 0) {
      throw new DomainException('User ID cannot be empty');
    }

    if (!args.companyId || args.companyId.trim().length === 0) {
      throw new DomainException('Company ID cannot be empty');
    }

    if (args.position && args.position.length > 100) {
      throw new DomainException('Position is too long (max 100 characters)');
    }

    return new UserCompany({
      id: args.id,
      userId: args.userId,
      companyId: args.companyId,
      position: args.position?.trim() || null,
      isPrimary: args.isPrimary,
      joinedAt: new Date(),
    });
  }

  public static reconstitute(props: UserCompanyProps): UserCompany {
    return new UserCompany(props);
  }

  public updatePosition(position: string): void {
    if (!position || position.trim().length === 0) {
      throw new DomainException('Position cannot be empty');
    }

    if (position.length > 100) {
      throw new DomainException('Position is too long (max 100 characters)');
    }

    this._position = position.trim();
  }

  public setAsPrimary(): void {
    this._isPrimary = true;
  }

  public unsetAsPrimary(): void {
    this._isPrimary = false;
  }

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
