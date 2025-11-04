import { ValueObject } from '../base/base.value-object';
import { DomainException } from '../exceptions/domain.exception';

/**
 * ExperienceLevel Value Object
 * Represents candidate's experience level
 */
export class ExperienceLevel extends ValueObject<{ value: string }> {
  public static readonly JUNIOR = 'junior';
  public static readonly MID = 'mid';
  public static readonly SENIOR = 'senior';
  public static readonly LEAD = 'lead';

  private static readonly VALID_LEVELS = [
    ExperienceLevel.JUNIOR,
    ExperienceLevel.MID,
    ExperienceLevel.SENIOR,
    ExperienceLevel.LEAD,
  ] as const;

  private constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  /**
   * Create ExperienceLevel from string
   */
  public static fromString(level: string): ExperienceLevel {
    const normalized = level.toLowerCase().trim();

    if (!this.isValid(normalized)) {
      throw new DomainException(
        `Invalid experience level: ${level}. Must be one of: ${this.VALID_LEVELS.join(', ')}`,
      );
    }

    return new ExperienceLevel(normalized);
  }

  /**
   * Factory methods
   */
  public static junior(): ExperienceLevel {
    return new ExperienceLevel(ExperienceLevel.JUNIOR);
  }

  public static mid(): ExperienceLevel {
    return new ExperienceLevel(ExperienceLevel.MID);
  }

  public static senior(): ExperienceLevel {
    return new ExperienceLevel(ExperienceLevel.SENIOR);
  }

  public static lead(): ExperienceLevel {
    return new ExperienceLevel(ExperienceLevel.LEAD);
  }

  /**
   * Validation
   */
  private static isValid(level: string): boolean {
    return this.VALID_LEVELS.includes(level as any);
  }

  /**
   * Type guards
   */
  public isJunior(): boolean {
    return this.value === ExperienceLevel.JUNIOR;
  }

  public isMid(): boolean {
    return this.value === ExperienceLevel.MID;
  }

  public isSenior(): boolean {
    return this.value === ExperienceLevel.SENIOR;
  }

  public isLead(): boolean {
    return this.value === ExperienceLevel.LEAD;
  }

  /**
   * Get experience in years (approximate)
   */
  public getYearsRange(): string {
    const ranges: Record<string, string> = {
      [ExperienceLevel.JUNIOR]: '0-2 years',
      [ExperienceLevel.MID]: '2-5 years',
      [ExperienceLevel.SENIOR]: '5+ years',
      [ExperienceLevel.LEAD]: '7+ years',
    };

    return ranges[this.value] || 'Unknown';
  }

  /**
   * Get display name
   */
  public getDisplayName(): string {
    const displayNames: Record<string, string> = {
      [ExperienceLevel.JUNIOR]: 'Junior',
      [ExperienceLevel.MID]: 'Mid-Level',
      [ExperienceLevel.SENIOR]: 'Senior',
      [ExperienceLevel.LEAD]: 'Lead/Architect',
    };

    return displayNames[this.value] || this.value;
  }

  /**
   * Equality check
   */
  public equals(other: ExperienceLevel): boolean {
    if (!(other instanceof ExperienceLevel)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * String representation
   */
  public toString(): string {
    return this.value;
  }
}
