import { AggregateRoot } from '../base/base.aggregate-root';
import type { ExperienceLevel } from '../value-objects/experience-level.vo';
import type { ProficiencyLevel } from '../value-objects/proficiency-level.vo';
import type { YearsOfExperience } from '../value-objects/years-of-experience.vo';
import { CandidateSkill } from '../entities/candidate-skill.entity';
import { DomainException } from '../exceptions/domain.exception';
import {
  CandidateSkillAlreadyExistsException,
  CandidateSkillNotFoundException,
} from '../exceptions/candidate.exceptions';
import { CandidateSkillAddedEvent } from '../events/candidate-skill-added.event';
import {
  CandidateSkillUpdatedEvent,
  type CandidateSkillChanges,
} from '../events/candidate-skill-updated.event';
import { CandidateSkillRemovedEvent } from '../events/candidate-skill-removed.event';

/**
 * Full state of a {@link CandidateProfile} aggregate.
 */
export interface CandidateProfileProps {
  userId: string;
  experienceLevel: ExperienceLevel | null;
  skills?: CandidateSkill[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Args for {@link CandidateProfile.addSkill}.
 */
export interface AddSkillArgs {
  skillId: string;
  candidateSkillId: string;
  description: string | null;
  proficiencyLevel: ProficiencyLevel | null;
  yearsOfExperience: YearsOfExperience | null;
}

/**
 * CandidateProfile Aggregate Root.
 * Represents candidate-specific profile information; linked 1:1 with User
 * (where user.role = 'candidate'); manages candidate's skills with
 * descriptions and proficiency levels.
 */
export class CandidateProfile extends AggregateRoot {
  private readonly _userId: string;
  private _experienceLevel: ExperienceLevel | null;
  private readonly _skills: CandidateSkill[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: CandidateProfileProps) {
    super();
    this._userId = props.userId;
    this._experienceLevel = props.experienceLevel;
    this._skills = props.skills ?? [];
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  /**
   * Create new candidate profile with empty skills and no experience level.
   */
  public static create(userId: string): CandidateProfile {
    if (!userId || userId.trim().length === 0) {
      throw new DomainException('User ID cannot be empty');
    }

    return new CandidateProfile({
      userId,
      experienceLevel: null,
    });
  }

  /**
   * Reconstitute from persistence.
   */
  public static reconstitute(props: CandidateProfileProps): CandidateProfile {
    return new CandidateProfile(props);
  }

  /**
   * Add skill to candidate profile.
   * Creates a new CandidateSkill entity and publishes
   * {@link CandidateSkillAddedEvent}.
   */
  public addSkill(args: AddSkillArgs): void {
    const exists = this._skills.some((s) => s.skillId === args.skillId);
    if (exists) {
      throw new CandidateSkillAlreadyExistsException(args.skillId);
    }

    const skill = CandidateSkill.create({
      id: args.candidateSkillId,
      candidateId: this._userId,
      skillId: args.skillId,
      description: args.description,
      proficiencyLevel: args.proficiencyLevel,
      yearsOfExperience: args.yearsOfExperience,
    });

    this._skills.push(skill);
    this._updatedAt = new Date();

    this.apply(
      new CandidateSkillAddedEvent({
        candidateId: this._userId,
        skillId: args.skillId,
        proficiencyLevel: args.proficiencyLevel?.value ?? 'beginner',
        yearsOfExperience: args.yearsOfExperience?.value ?? 0,
      }),
    );
  }

  /**
   * Update existing skill.
   */
  public updateSkill(
    skillId: string,
    description: string | null,
    proficiencyLevel: ProficiencyLevel | null,
    yearsOfExperience: YearsOfExperience | null,
  ): void {
    const skill = this._skills.find((s) => s.skillId === skillId);

    if (!skill) {
      throw new CandidateSkillNotFoundException(skillId);
    }

    const changes: CandidateSkillChanges = {};

    if (description !== skill.description) {
      skill.updateDescription(description ?? '');
      changes.description = description;
    }

    if (proficiencyLevel === null && skill.proficiencyLevel !== null) {
      skill.updateProficiency(null);
      changes.proficiencyLevel = null;
    } else if (
      proficiencyLevel &&
      (!skill.proficiencyLevel ||
        !proficiencyLevel.equals(skill.proficiencyLevel))
    ) {
      skill.updateProficiency(proficiencyLevel);
      changes.proficiencyLevel = proficiencyLevel.value;
    }

    if (yearsOfExperience === null && skill.yearsOfExperience !== null) {
      skill.updateYears(null);
      changes.yearsOfExperience = null;
    } else if (
      yearsOfExperience &&
      (!skill.yearsOfExperience ||
        !yearsOfExperience.equals(skill.yearsOfExperience))
    ) {
      skill.updateYears(yearsOfExperience);
      changes.yearsOfExperience = yearsOfExperience.value;
    }

    if (Object.keys(changes).length > 0) {
      this._updatedAt = new Date();
      this.apply(
        new CandidateSkillUpdatedEvent(this._userId, skillId, changes),
      );
    }
  }

  /**
   * Remove skill from profile.
   */
  public removeSkill(skillId: string): void {
    const index = this._skills.findIndex((s) => s.skillId === skillId);

    if (index === -1) {
      throw new CandidateSkillNotFoundException(skillId);
    }

    this._skills.splice(index, 1);
    this._updatedAt = new Date();

    this.apply(new CandidateSkillRemovedEvent(this._userId, skillId));
  }

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
    return this._skills;
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
