import { DomainException } from '../exceptions/domain.exception';

/**
 * YearsOfExperience Value Object
 * Represents years of experience with a specific skill (0-50)
 */
export class YearsOfExperience {
  private static readonly MIN_YEARS = 0;
  private static readonly MAX_YEARS = 50;

  private constructor(private readonly _value: number) {
    this.validate(_value);
  }

  private validate(value: number): void {
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
    return this._value > other._value;
  }

  public isLessThan(other: YearsOfExperience): boolean {
    return this._value < other._value;
  }

  public isGreaterOrEqual(other: YearsOfExperience): boolean {
    return this._value >= other._value;
  }

  public isLessOrEqual(other: YearsOfExperience): boolean {
    return this._value <= other._value;
  }

  public equals(other: YearsOfExperience): boolean {
    return this._value === other._value;
  }

  public add(years: number): YearsOfExperience {
    return new YearsOfExperience(this._value + years);
  }

  public get value(): number {
    return this._value;
  }

  public toString(): string {
    if (this._value === 0) {
      return 'No experience';
    }
    if (this._value === 1) {
      return '1 year';
    }
    return `${this._value} years`;
  }
}
