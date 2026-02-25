import { ValueObject } from '../base/base.value-object';
import { DomainException } from '../exceptions/domain.exception';

/**
 * YearsOfExperience Value Object
 * Represents years of experience with a specific skill (0-50)
 */
export class YearsOfExperience extends ValueObject<{ value: number }> {
  private static readonly MIN_YEARS = 0;
  private static readonly MAX_YEARS = 50;

  private constructor(value: number) {
    YearsOfExperience.validate(value);
    super({ value });
  }

  private static validate(value: number): void {
    if (!Number.isInteger(value)) {
      throw new DomainException('Years of experience must be an integer');
    }

    if (value < YearsOfExperience.MIN_YEARS) {
      throw new DomainException(
        `Years of experience cannot be negative (got ${value})`
      );
    }

    if (value > YearsOfExperience.MAX_YEARS) {
      throw new DomainException(
        `Years of experience cannot exceed ${YearsOfExperience.MAX_YEARS} (got ${value})`
      );
    }
  }

  public static fromNumber(value: number): YearsOfExperience {
    return new YearsOfExperience(value);
  }

  public static zero(): YearsOfExperience {
    return new YearsOfExperience(0);
  }

  // Comparison methods
  public isGreaterThan(other: YearsOfExperience): boolean {
    return this.value > other.value;
  }

  public isLessThan(other: YearsOfExperience): boolean {
    return this.value < other.value;
  }

  public isGreaterOrEqual(other: YearsOfExperience): boolean {
    return this.value >= other.value;
  }

  public isLessOrEqual(other: YearsOfExperience): boolean {
    return this.value <= other.value;
  }

  public equals(other: YearsOfExperience): boolean {
    if (!(other instanceof YearsOfExperience)) {
      return false;
    }
    return this.value === other.value;
  }

  public add(years: number): YearsOfExperience {
    return new YearsOfExperience(this.value + years);
  }

  public get value(): number {
    return this.props.value;
  }

  public toString(): string {
    if (this.value === 0) {
      return 'No experience';
    }
    if (this.value === 1) {
      return '1 year';
    }
    return `${this.value} years`;
  }
}
