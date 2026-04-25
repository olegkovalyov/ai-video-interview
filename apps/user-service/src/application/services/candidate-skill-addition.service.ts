import { Injectable, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { v4 as uuid } from 'uuid';
import { CandidateProfile } from '../../domain/aggregates/candidate-profile.aggregate';
import { ProficiencyLevel } from '../../domain/value-objects/proficiency-level.vo';
import { YearsOfExperience } from '../../domain/value-objects/years-of-experience.vo';
import type { ICandidateProfileRepository } from '../../domain/repositories/candidate-profile.repository.interface';
import type { ISkillReadRepository } from '../../domain/repositories/skill-read.repository.interface';
import {
  SkillNotFoundException,
  SkillNotActiveException,
} from '../../domain/exceptions/skill.exceptions';
import {
  CandidateProfileNotFoundException,
  CandidateSkillAlreadyExistsException,
} from '../../domain/exceptions/candidate.exceptions';
import { LoggerService } from '../../infrastructure/logger/logger.service';

export interface AddCandidateSkillInput {
  candidateId: string;
  skillId: string;
  description: string | null;
  proficiencyLevel: string | null;
  yearsOfExperience: number | null;
}

interface SkillReference {
  isActive: boolean;
  name: string;
}

/**
 * Application service that owns the "add skill to candidate profile" use
 * case. Validates the catalogue entry (exists + active), loads the
 * profile, checks for duplicates, and applies the addition through the
 * aggregate.
 */
@Injectable()
export class CandidateSkillAdditionService {
  constructor(
    @Inject('ICandidateProfileRepository')
    private readonly profileRepository: ICandidateProfileRepository,
    @Inject('ISkillReadRepository')
    private readonly skillReadRepository: ISkillReadRepository,
    private readonly eventBus: EventBus,
    private readonly logger: LoggerService,
  ) {}

  async add(
    input: AddCandidateSkillInput,
  ): Promise<{ candidateSkillId: string }> {
    this.logger.info('Adding skill to candidate profile', {
      candidateId: input.candidateId,
      skillId: input.skillId,
    });

    const skill = await this.loadActiveSkill(input.skillId);
    const profile = await this.loadProfile(input.candidateId);
    await this.assertSkillNotInProfile(input, skill);

    const candidateSkillId = uuid();
    this.applySkillToProfile(profile, input, candidateSkillId);
    await this.profileRepository.save(profile);
    this.publishInternalEvents(profile);

    this.logger.info('Skill added to candidate profile successfully', {
      candidateId: input.candidateId,
      skillId: input.skillId,
      candidateSkillId,
    });
    return { candidateSkillId };
  }

  private applySkillToProfile(
    profile: CandidateProfile,
    input: AddCandidateSkillInput,
    candidateSkillId: string,
  ): void {
    profile.addSkill({
      skillId: input.skillId,
      candidateSkillId,
      description: input.description,
      proficiencyLevel: CandidateSkillAdditionService.toProficiency(
        input.proficiencyLevel,
      ),
      yearsOfExperience: CandidateSkillAdditionService.toYears(
        input.yearsOfExperience,
      ),
    });
  }

  private async loadActiveSkill(skillId: string): Promise<SkillReference> {
    const skill = await this.skillReadRepository.findById(skillId);
    if (!skill) throw new SkillNotFoundException(skillId);
    if (!skill.isActive) throw new SkillNotActiveException(skill.name);
    return skill;
  }

  private async loadProfile(candidateId: string): Promise<CandidateProfile> {
    const profile = await this.profileRepository.findByUserId(candidateId);
    if (!profile) throw new CandidateProfileNotFoundException(candidateId);
    return profile;
  }

  private async assertSkillNotInProfile(
    input: AddCandidateSkillInput,
    skill: SkillReference,
  ): Promise<void> {
    const has = await this.profileRepository.hasSkill(
      input.candidateId,
      input.skillId,
    );
    if (has) throw new CandidateSkillAlreadyExistsException(skill.name);
  }

  private static toProficiency(value: string | null): ProficiencyLevel | null {
    return value === null ? null : ProficiencyLevel.fromString(value);
  }

  private static toYears(value: number | null): YearsOfExperience | null {
    return value === null ? null : YearsOfExperience.fromNumber(value);
  }

  private publishInternalEvents(profile: CandidateProfile): void {
    profile.getUncommittedEvents().forEach((event) => {
      this.eventBus.publish(event);
    });
    profile.clearEvents();
  }
}
