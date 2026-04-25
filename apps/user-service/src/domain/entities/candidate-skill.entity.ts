import { DomainException } from '../exceptions/domain.exception';
import type { ProficiencyLevel } from '../value-objects/proficiency-level.vo';
import type { YearsOfExperience } from '../value-objects/years-of-experience.vo';

/**
 * Full state of a {@link CandidateSkill}.
 */
export interface CandidateSkillProps {
  id: string;
  candidateId: string;
  skillId: string;
  description: string | null;
  proficiencyLevel: ProficiencyLevel | null;
  yearsOfExperience: YearsOfExperience | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCandidateSkillArgs {
  id: string;
  candidateId: string;
  skillId: string;
  description: string | null;
  proficiencyLevel: ProficiencyLevel | null;
  yearsOfExperience: YearsOfExperience | null;
}

/**
 * CandidateSkill Entity
 * Represents a candidate's skill with metadata (description, proficiency, years).
 * Belongs to CandidateProfile aggregate.
 */
export class CandidateSkill {
  private readonly _id: string;
  private readonly _candidateId: string;
  private readonly _skillId: string;
  private _description: string | null;
  private _proficiencyLevel: ProficiencyLevel | null;
  private _yearsOfExperience: YearsOfExperience | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: CandidateSkillProps) {
    this._id = props.id;
    this._candidateId = props.candidateId;
    this._skillId = props.skillId;
    this._description = props.description;
    this._proficiencyLevel = props.proficiencyLevel;
    this._yearsOfExperience = props.yearsOfExperience;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Create new candidate skill.
   */
  public static create(args: CreateCandidateSkillArgs): CandidateSkill {
    if (!args.candidateId || args.candidateId.trim().length === 0) {
      throw new DomainException('Candidate ID cannot be empty');
    }

    if (!args.skillId || args.skillId.trim().length === 0) {
      throw new DomainException('Skill ID cannot be empty');
    }

    if (args.description && args.description.length > 1000) {
      throw new DomainException(
        'Skill description is too long (max 1000 characters)',
      );
    }

    const now = new Date();
    return new CandidateSkill({
      id: args.id,
      candidateId: args.candidateId,
      skillId: args.skillId,
      description: args.description?.trim() || null,
      proficiencyLevel: args.proficiencyLevel,
      yearsOfExperience: args.yearsOfExperience,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from persistence.
   */
  public static reconstitute(props: CandidateSkillProps): CandidateSkill {
    return new CandidateSkill(props);
  }

  public updateDescription(description: string): void {
    if (description.length > 1000) {
      throw new DomainException(
        'Skill description is too long (max 1000 characters)',
      );
    }

    this._description = description.trim() || null;
    this._updatedAt = new Date();
  }

  public updateProficiency(proficiencyLevel: ProficiencyLevel | null): void {
    this._proficiencyLevel = proficiencyLevel;
    this._updatedAt = new Date();
  }

  public updateYears(yearsOfExperience: YearsOfExperience | null): void {
    this._yearsOfExperience = yearsOfExperience;
    this._updatedAt = new Date();
  }

  /**
   * Update all metadata at once.
   */
  public update(
    description: string | null,
    proficiencyLevel: ProficiencyLevel | null,
    yearsOfExperience: YearsOfExperience | null,
  ): void {
    if (description && description.length > 1000) {
      throw new DomainException(
        'Skill description is too long (max 1000 characters)',
      );
    }

    this._description = description?.trim() || null;
    this._proficiencyLevel = proficiencyLevel;
    this._yearsOfExperience = yearsOfExperience;
    this._updatedAt = new Date();
  }

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
