import { DomainException } from '../exceptions/domain.exception';

/**
 * ProficiencyLevel Value Object
 * Represents candidate's proficiency level with a skill
 */
export class ProficiencyLevel {
  private static readonly VALID_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
  
  public static readonly BEGINNER = 'beginner';
  public static readonly INTERMEDIATE = 'intermediate';
  public static readonly ADVANCED = 'advanced';
  public static readonly EXPERT = 'expert';

  private constructor(private readonly _value: string) {
    this.validate(_value);
  }

  private validate(value: string): void {
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
    return this._value === ProficiencyLevel.BEGINNER;
  }

  public isIntermediate(): boolean {
    return this._value === ProficiencyLevel.INTERMEDIATE;
  }

  public isAdvanced(): boolean {
    return this._value === ProficiencyLevel.ADVANCED;
  }

  public isExpert(): boolean {
    return this._value === ProficiencyLevel.EXPERT;
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
    
    const thisIndex = levels.indexOf(this._value);
    const otherIndex = levels.indexOf(other._value);
    
    return thisIndex - otherIndex;
  }

  public isAtLeast(level: ProficiencyLevel): boolean {
    return this.compare(level) >= 0;
  }

  public equals(other: ProficiencyLevel): boolean {
    return this._value === other._value;
  }

  public get value(): string {
    return this._value;
  }

  public toString(): string {
    return this._value;
  }
}
