import { AggregateRoot } from '../base/base.aggregate-root';
import { ExperienceLevel } from '../value-objects/experience-level.vo';
import { DomainException } from '../exceptions/domain.exception';

/**
 * CandidateProfile Aggregate Root
 * Represents candidate-specific profile information
 * Linked 1:1 with User (where user.role = 'candidate')
 */
export class CandidateProfile extends AggregateRoot {
  private constructor(
    private readonly _userId: string,
    private _skills: string[],
    private _experienceLevel: ExperienceLevel | null,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {
    super();
  }

  // ========================================
  // FACTORY METHODS
  // ========================================

  /**
   * Create new candidate profile with default (empty) values
   */
  public static create(userId: string): CandidateProfile {
    if (!userId || userId.trim().length === 0) {
      throw new DomainException('User ID cannot be empty');
    }

    return new CandidateProfile(
      userId,
      [], // Empty skills
      null, // No experience level selected
      new Date(),
      new Date(),
    );
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    userId: string,
    skills: string[],
    experienceLevel: ExperienceLevel | null,
    createdAt: Date,
    updatedAt: Date,
  ): CandidateProfile {
    return new CandidateProfile(
      userId,
      skills,
      experienceLevel,
      createdAt,
      updatedAt,
    );
  }

  // ========================================
  // BUSINESS LOGIC
  // ========================================

  /**
   * Update skills
   */
  public updateSkills(skills: string[]): void {
    // Validate and clean skills
    const cleanedSkills = skills
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    // Remove duplicates (case-insensitive)
    const uniqueSkills = Array.from(
      new Set(cleanedSkills.map(s => s.toLowerCase()))
    ).map(s => {
      // Find original case
      return cleanedSkills.find(skill => skill.toLowerCase() === s) || s;
    });

    this._skills = uniqueSkills;
    this._updatedAt = new Date();
  }

  /**
   * Add skill
   */
  public addSkill(skill: string): void {
    const cleaned = skill.trim();
    
    if (cleaned.length === 0) {
      throw new DomainException('Skill cannot be empty');
    }

    // Check if already exists (case-insensitive)
    const exists = this._skills.some(
      s => s.toLowerCase() === cleaned.toLowerCase()
    );

    if (!exists) {
      this._skills.push(cleaned);
      this._updatedAt = new Date();
    }
  }

  /**
   * Remove skill
   */
  public removeSkill(skill: string): void {
    const cleaned = skill.trim().toLowerCase();
    
    this._skills = this._skills.filter(
      s => s.toLowerCase() !== cleaned
    );
    
    this._updatedAt = new Date();
  }

  /**
   * Update experience level
   */
  public updateExperienceLevel(level: ExperienceLevel): void {
    this._experienceLevel = level;
    this._updatedAt = new Date();
  }

  /**
   * Check if profile is complete
   */
  public isComplete(): boolean {
    return this._skills.length > 0 && this._experienceLevel !== null;
  }

  /**
   * Get completion percentage
   */
  public getCompletionPercentage(): number {
    let completed = 0;
    const total = 2; // skills and experience

    if (this._skills.length > 0) completed++;
    if (this._experienceLevel !== null) completed++;

    return Math.round((completed / total) * 100);
  }

  // ========================================
  // GETTERS
  // ========================================

  public get userId(): string {
    return this._userId;
  }

  public get skills(): string[] {
    return [...this._skills]; // Return copy to prevent external modification
  }

  public get experienceLevel(): ExperienceLevel | null {
    return this._experienceLevel;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }
}
