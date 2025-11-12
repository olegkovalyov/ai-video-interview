import { DomainException } from '../exceptions/domain.exception';
import { ProficiencyLevel } from '../value-objects/proficiency-level.vo';
import { YearsOfExperience } from '../value-objects/years-of-experience.vo';

/**
 * CandidateSkill Entity
 * Represents a candidate's skill with metadata (description, proficiency, years)
 * Belongs to CandidateProfile aggregate
 */
export class CandidateSkill {
  private constructor(
    private readonly _id: string,
    private readonly _candidateId: string,
    private readonly _skillId: string,
    private _description: string | null,
    private _proficiencyLevel: ProficiencyLevel | null,
    private _yearsOfExperience: YearsOfExperience | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // ========================================
  // FACTORY METHODS
  // ========================================

  /**
   * Create new candidate skill
   */
  public static create(
    id: string,
    candidateId: string,
    skillId: string,
    description: string | null,
    proficiencyLevel: ProficiencyLevel | null,
    yearsOfExperience: YearsOfExperience | null,
  ): CandidateSkill {
    if (!candidateId || candidateId.trim().length === 0) {
      throw new DomainException('Candidate ID cannot be empty');
    }

    if (!skillId || skillId.trim().length === 0) {
      throw new DomainException('Skill ID cannot be empty');
    }

    // Validate description length
    if (description && description.length > 1000) {
      throw new DomainException('Skill description is too long (max 1000 characters)');
    }

    return new CandidateSkill(
      id,
      candidateId,
      skillId,
      description?.trim() || null,
      proficiencyLevel,
      yearsOfExperience,
      new Date(),
      new Date(),
    );
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    candidateId: string,
    skillId: string,
    description: string | null,
    proficiencyLevel: ProficiencyLevel | null,
    yearsOfExperience: YearsOfExperience | null,
    createdAt: Date,
    updatedAt: Date,
  ): CandidateSkill {
    return new CandidateSkill(
      id,
      candidateId,
      skillId,
      description,
      proficiencyLevel,
      yearsOfExperience,
      createdAt,
      updatedAt,
    );
  }

  // ========================================
  // BUSINESS LOGIC
  // ========================================

  /**
   * Update skill description
   */
  public updateDescription(description: string): void {
    if (description.length > 1000) {
      throw new DomainException('Skill description is too long (max 1000 characters)');
    }

    this._description = description.trim() || null;
    this._updatedAt = new Date();
  }

  /**
   * Update proficiency level
   */
  public updateProficiency(proficiencyLevel: ProficiencyLevel | null): void {
    this._proficiencyLevel = proficiencyLevel;
    this._updatedAt = new Date();
  }

  /**
   * Update years of experience
   */
  public updateYears(yearsOfExperience: YearsOfExperience | null): void {
    this._yearsOfExperience = yearsOfExperience;
    this._updatedAt = new Date();
  }

  /**
   * Update all metadata at once
   */
  public update(
    description: string | null,
    proficiencyLevel: ProficiencyLevel | null,
    yearsOfExperience: YearsOfExperience | null,
  ): void {
    if (description && description.length > 1000) {
      throw new DomainException('Skill description is too long (max 1000 characters)');
    }

    this._description = description?.trim() || null;
    this._proficiencyLevel = proficiencyLevel;
    this._yearsOfExperience = yearsOfExperience;
    this._updatedAt = new Date();
  }

  // ========================================
  // GETTERS
  // ========================================

  public get id(): string {
    return this._id;
  }

  public get candidateId(): string {
    return this._candidateId;
  }

  public get skillId(): string {
    return this._skillId;
  }

  public get description(): string | null {
    return this._description;
  }

  public get proficiencyLevel(): ProficiencyLevel | null {
    return this._proficiencyLevel;
  }

  public get yearsOfExperience(): YearsOfExperience | null {
    return this._yearsOfExperience;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }
}
