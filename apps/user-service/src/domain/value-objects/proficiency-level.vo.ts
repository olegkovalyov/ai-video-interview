import { ValueObject } from '../base/base.value-object';
import { DomainException } from '../exceptions/domain.exception';

/**
 * ProficiencyLevel Value Object
 * Represents candidate's proficiency level with a skill
 */
export class ProficiencyLevel extends ValueObject<{ value: string }> {
  private static readonly VALID_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

  public static readonly BEGINNER = 'beginner';
  public static readonly INTERMEDIATE = 'intermediate';
  public static readonly ADVANCED = 'advanced';
  public static readonly EXPERT = 'expert';

  private constructor(value: string) {
    ProficiencyLevel.validate(value);
    super({ value });
  }

  private static validate(value: string): void {
    if (!ProficiencyLevel.VALID_LEVELS.includes(value as any)) {
      throw new DomainException(
        `Invalid proficiency level: ${value}. Must be one of: ${ProficiencyLevel.VALID_LEVELS.join(', ')}`
      );
    }
  }

  // Factory methods
  public static beginner(): ProficiencyLevel {
    return new ProficiencyLevel(ProficiencyLevel.BEGINNER);
  }

  public static intermediate(): ProficiencyLevel {
    return new ProficiencyLevel(ProficiencyLevel.INTERMEDIATE);
  }

  public static advanced(): ProficiencyLevel {
    return new ProficiencyLevel(ProficiencyLevel.ADVANCED);
  }

  public static expert(): ProficiencyLevel {
    return new ProficiencyLevel(ProficiencyLevel.EXPERT);
  }

  public static fromString(value: string): ProficiencyLevel {
    return new ProficiencyLevel(value.toLowerCase());
  }

  // Comparison methods
  public isBeginner(): boolean {
    return this.value === ProficiencyLevel.BEGINNER;
  }

  public isIntermediate(): boolean {
    return this.value === ProficiencyLevel.INTERMEDIATE;
  }

  public isAdvanced(): boolean {
    return this.value === ProficiencyLevel.ADVANCED;
  }

  public isExpert(): boolean {
    return this.value === ProficiencyLevel.EXPERT;
  }

  /**
   * Compare proficiency levels
   * Returns:
   *  -1 if this < other
   *   0 if this == other
   *   1 if this > other
   */
  public compare(other: ProficiencyLevel): number {
    const levels = [
      ProficiencyLevel.BEGINNER,
      ProficiencyLevel.INTERMEDIATE,
      ProficiencyLevel.ADVANCED,
      ProficiencyLevel.EXPERT,
    ];

    const thisIndex = levels.indexOf(this.value);
    const otherIndex = levels.indexOf(other.value);

    return thisIndex - otherIndex;
  }

  public isAtLeast(level: ProficiencyLevel): boolean {
    return this.compare(level) >= 0;
  }

  public equals(other: ProficiencyLevel): boolean {
    if (!(other instanceof ProficiencyLevel)) {
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
}
