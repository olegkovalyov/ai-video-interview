import { Injectable, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { CandidateProfile } from '../../domain/aggregates/candidate-profile.aggregate';
import { ProficiencyLevel } from '../../domain/value-objects/proficiency-level.vo';
import { YearsOfExperience } from '../../domain/value-objects/years-of-experience.vo';
import type { ICandidateProfileRepository } from '../../domain/repositories/candidate-profile.repository.interface';
import { CandidateProfileNotFoundException } from '../../domain/exceptions/candidate.exceptions';
import { LoggerService } from '../../infrastructure/logger/logger.service';

export interface UpdateCandidateSkillInput {
  candidateId: string;
  skillId: string;
  description: string | null;
  proficiencyLevel: string | null;
  yearsOfExperience: number | null;
}

/**
 * Application service that owns the "update existing candidate skill"
 * use case. Loads the profile, parses the value objects, and delegates
 * the diff to {@link CandidateProfile.updateSkill}.
 *
 * Sibling of {@link CandidateSkillAdditionService} — kept separate
 * because the addition service additionally validates the catalogue
 * entry (active + not duplicate) which is irrelevant for updates.
 */
@Injectable()
export class CandidateSkillUpdateService {
  constructor(
    @Inject('ICandidateProfileRepository')
    private readonly profileRepository: ICandidateProfileRepository,
    private readonly eventBus: EventBus,
    private readonly logger: LoggerService,
  ) {}

  async update(input: UpdateCandidateSkillInput): Promise<void> {
    this.logger.info('Updating candidate skill', {
      candidateId: input.candidateId,
      skillId: input.skillId,
    });

    const profile = await this.loadProfile(input.candidateId);
    profile.updateSkill(
      input.skillId,
      input.description,
      CandidateSkillUpdateService.toProficiency(input.proficiencyLevel),
      CandidateSkillUpdateService.toYears(input.yearsOfExperience),
    );

    await this.profileRepository.save(profile);
    this.publishInternalEvents(profile);

    this.logger.info('Candidate skill updated successfully', {
      candidateId: input.candidateId,
      skillId: input.skillId,
    });
  }

  private async loadProfile(candidateId: string): Promise<CandidateProfile> {
    const profile = await this.profileRepository.findByUserId(candidateId);
    if (!profile) throw new CandidateProfileNotFoundException(candidateId);
    return profile;
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
