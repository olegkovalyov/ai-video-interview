import { ValueObject } from '../base/base.value-object';
import { DomainException } from '../exceptions/domain.exception';

/**
 * CompanySize Value Object
 * Represents company size ranges
 */
export class CompanySize extends ValueObject<{ value: string }> {
  private static readonly VALID_SIZES = [
    '1-10',
    '11-50',
    '51-200',
    '200+',
  ] as const;

  public static readonly SMALL = '1-10';
  public static readonly MEDIUM = '11-50';
  public static readonly LARGE = '51-200';
  public static readonly ENTERPRISE = '200+';

  private constructor(value: string) {
    CompanySize.validate(value);
    super({ value });
  }

  private static validate(value: string): void {
    if (!CompanySize.VALID_SIZES.includes(value as any)) {
      throw new DomainException(
        `Invalid company size: ${value}. Must be one of: ${CompanySize.VALID_SIZES.join(', ')}`
      );
    }
  }

  // Factory methods
  public static small(): CompanySize {
    return new CompanySize(CompanySize.SMALL);
  }

  public static medium(): CompanySize {
    return new CompanySize(CompanySize.MEDIUM);
  }

  public static large(): CompanySize {
    return new CompanySize(CompanySize.LARGE);
  }

  public static enterprise(): CompanySize {
    return new CompanySize(CompanySize.ENTERPRISE);
  }

  public static fromString(value: string): CompanySize {
    return new CompanySize(value);
  }

  // Type guards
  public isSmall(): boolean {
    return this.value === CompanySize.SMALL;
  }

  public isMedium(): boolean {
    return this.value === CompanySize.MEDIUM;
  }

  public isLarge(): boolean {
    return this.value === CompanySize.LARGE;
  }

  public isEnterprise(): boolean {
    return this.value === CompanySize.ENTERPRISE;
  }

  public equals(other: CompanySize): boolean {
    if (!(other instanceof CompanySize)) {
      return false;
    }
    return this.value === other.value;
  }

  public get value(): string {
    return this.props.value;
  }

  public toString(): string {
    return this.value;
  }

  /**
   * Get human-readable description
   */
  public getDescription(): string {
    switch (this.value) {
      case CompanySize.SMALL:
        return '1-10 employees';
      case CompanySize.MEDIUM:
        return '11-50 employees';
      case CompanySize.LARGE:
        return '51-200 employees';
      case CompanySize.ENTERPRISE:
        return '200+ employees';
      default:
        return this.value;
    }
  }
}
