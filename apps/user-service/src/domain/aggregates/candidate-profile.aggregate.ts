import { AggregateRoot } from '../base/base.aggregate-root';
import { ExperienceLevel } from '../value-objects/experience-level.vo';
import { ProficiencyLevel } from '../value-objects/proficiency-level.vo';
import { YearsOfExperience } from '../value-objects/years-of-experience.vo';
import { CandidateSkill } from '../entities/candidate-skill.entity';
import { DomainException } from '../exceptions/domain.exception';
import { CandidateSkillAddedEvent } from '../events/candidate-skill-added.event';
import { CandidateSkillUpdatedEvent } from '../events/candidate-skill-updated.event';
import { CandidateSkillRemovedEvent } from '../events/candidate-skill-removed.event';

/**
 * CandidateProfile Aggregate Root
 * Represents candidate-specific profile information
 * Linked 1:1 with User (where user.role = 'candidate')
 * Manages candidate's skills with descriptions and proficiency levels
 */
export class CandidateProfile extends AggregateRoot {
  private constructor(
    private readonly _userId: string,
    private _experienceLevel: ExperienceLevel | null,
    private _skills: CandidateSkill[] = [],
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
      null, // No experience level selected
      [], // Empty skills
      new Date(),
      new Date(),
    );
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    userId: string,
    experienceLevel: ExperienceLevel | null,
    skills: CandidateSkill[],
    createdAt: Date,
    updatedAt: Date,
  ): CandidateProfile {
    return new CandidateProfile(
      userId,
      experienceLevel,
      skills,
      createdAt,
      updatedAt,
    );
  }

  // ========================================
  // BUSINESS LOGIC
  // ========================================

  /**
   * Add skill to candidate profile
   * Creates a new CandidateSkill entity and publishes event
   */
  public addSkill(
    skillId: string,
    candidateSkillId: string,
    description: string | null,
    proficiencyLevel: ProficiencyLevel | null,
    yearsOfExperience: YearsOfExperience | null,
  ): void {
    // Check if skill already exists
    const exists = this._skills.some(s => s.skillId === skillId);
    if (exists) {
      throw new DomainException('Skill already added to profile');
    }

    // Create new skill entity
    const skill = CandidateSkill.create(
      candidateSkillId,
      this._userId,
      skillId,
      description,
      proficiencyLevel,
      yearsOfExperience,
    );

    this._skills.push(skill);
    this._updatedAt = new Date();

    // Publish domain event
    this.apply(
      new CandidateSkillAddedEvent(
        this._userId,
        skillId,
        proficiencyLevel?.value || 'beginner',
        yearsOfExperience?.value || 0,
      ),
    );
  }

  /**
   * Update existing skill
   */
  public updateSkill(
    skillId: string,
    description: string | null,
    proficiencyLevel: ProficiencyLevel | null,
    yearsOfExperience: YearsOfExperience | null,
  ): void {
    const skill = this._skills.find(s => s.skillId === skillId);
    
    if (!skill) {
      throw new DomainException('Skill not found in profile');
    }

    const changes: any = {};
    
    if (description !== skill.description) {
      skill.updateDescription(description || '');
      changes.description = description;
    }
    
    // Handle nullable proficiency
    if (proficiencyLevel === null && skill.proficiencyLevel !== null) {
      skill.updateProficiency(null);
      changes.proficiencyLevel = null;
    } else if (proficiencyLevel && (!skill.proficiencyLevel || !proficiencyLevel.equals(skill.proficiencyLevel))) {
      skill.updateProficiency(proficiencyLevel);
      changes.proficiencyLevel = proficiencyLevel.value;
    }
    
    // Handle nullable years
    if (yearsOfExperience === null && skill.yearsOfExperience !== null) {
      skill.updateYears(null);
      changes.yearsOfExperience = null;
    } else if (yearsOfExperience && (!skill.yearsOfExperience || !yearsOfExperience.equals(skill.yearsOfExperience))) {
      skill.updateYears(yearsOfExperience);
      changes.yearsOfExperience = yearsOfExperience.value;
    }

    if (Object.keys(changes).length > 0) {
      this._updatedAt = new Date();
      
      this.apply(
        new CandidateSkillUpdatedEvent(
          this._userId,
          skillId,
          changes,
        ),
      );
    }
  }

  /**
   * Remove skill from profile
   */
  public removeSkill(skillId: string): void {
    const index = this._skills.findIndex(s => s.skillId === skillId);
    
    if (index === -1) {
      throw new DomainException('Skill not found in profile');
    }

    this._skills.splice(index, 1);
    this._updatedAt = new Date();

    // Publish domain event
    this.apply(
      new CandidateSkillRemovedEvent(
        this._userId,
        skillId,
      ),
    );
  }

  /**
   * Update experience level
   */
  public updateExperienceLevel(level: ExperienceLevel): void {
    this._experienceLevel = level;
    this._updatedAt = new Date();
  }

  // ========================================
  // GETTERS
  // ========================================

  public get userId(): string {
    return this._userId;
  }

  public get skills(): readonly CandidateSkill[] {
    return this._skills; // Return readonly array
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
