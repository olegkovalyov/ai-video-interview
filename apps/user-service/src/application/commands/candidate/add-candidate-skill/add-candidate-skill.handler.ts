import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { AddCandidateSkillCommand } from './add-candidate-skill.command';
import { ProficiencyLevel } from '../../../../domain/value-objects/proficiency-level.vo';
import { YearsOfExperience } from '../../../../domain/value-objects/years-of-experience.vo';
import type { ICandidateProfileRepository } from '../../../../domain/repositories/candidate-profile.repository.interface';
import type { ISkillReadRepository } from '../../../../domain/repositories/skill-read.repository.interface';
import {
  SkillNotFoundException,
  SkillNotActiveException,
} from '../../../../domain/exceptions/skill.exceptions';
import {
  CandidateProfileNotFoundException,
  CandidateSkillAlreadyExistsException,
} from '../../../../domain/exceptions/candidate.exceptions';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';
import { v4 as uuid } from 'uuid';

/**
 * Add Candidate Skill Command Handler
 * Candidate adds a skill to their profile
 */
@CommandHandler(AddCandidateSkillCommand)
export class AddCandidateSkillHandler
  implements ICommandHandler<AddCandidateSkillCommand>
{
  constructor(
    @Inject('ICandidateProfileRepository')
    private readonly profileRepository: ICandidateProfileRepository,
    @Inject('ISkillReadRepository')
    private readonly skillReadRepository: ISkillReadRepository,
    private readonly eventBus: EventBus,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    command: AddCandidateSkillCommand,
  ): Promise<{ candidateSkillId: string }> {
    this.logger.info('Adding skill to candidate profile', {
      candidateId: command.candidateId,
      skillId: command.skillId,
    });

    // 1. Check if skill exists and is active
    const skill = await this.skillReadRepository.findById(command.skillId);
    if (!skill) {
      throw new SkillNotFoundException(command.skillId);
    }
    if (!skill.isActive) {
      throw new SkillNotActiveException(skill.name);
    }

    // 2. Find candidate profile
    const profile = await this.profileRepository.findByUserId(
      command.candidateId,
    );
    if (!profile) {
      throw new CandidateProfileNotFoundException(command.candidateId);
    }

    // 3. Check if skill already exists in profile
    const hasSkill = await this.profileRepository.hasSkill(
      command.candidateId,
      command.skillId,
    );
    if (hasSkill) {
      throw new CandidateSkillAlreadyExistsException(skill.name);
    }

    // 4. Create value objects (null means not specified)
    const proficiency = command.proficiencyLevel
      ? ProficiencyLevel.fromString(command.proficiencyLevel)
      : null;
    const years =
      command.yearsOfExperience === null
        ? null
        : YearsOfExperience.fromNumber(command.yearsOfExperience);

    // 5. Add skill to profile
    const candidateSkillId = uuid();
    profile.addSkill(
      command.skillId,
      candidateSkillId,
      command.description,
      proficiency,
      years,
    );

    // 6. Save profile
    await this.profileRepository.save(profile);

    // 7. Publish domain events
    const events = profile.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    profile.clearEvents();

    this.logger.info('Skill added to candidate profile successfully', {
      candidateId: command.candidateId,
      skillId: command.skillId,
      candidateSkillId,
    });

    return { candidateSkillId };
  }
}
