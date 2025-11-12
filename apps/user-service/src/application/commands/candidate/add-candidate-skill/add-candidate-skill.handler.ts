import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AddCandidateSkillCommand } from './add-candidate-skill.command';
import { ProficiencyLevel } from '../../../../domain/value-objects/proficiency-level.vo';
import { YearsOfExperience } from '../../../../domain/value-objects/years-of-experience.vo';
import type { ICandidateProfileRepository } from '../../../../domain/repositories/candidate-profile.repository.interface';
import type { ISkillReadRepository } from '../../../../domain/repositories/skill-read.repository.interface';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';
import { v4 as uuid } from 'uuid';

/**
 * Add Candidate Skill Command Handler
 * Candidate adds a skill to their profile
 */
@CommandHandler(AddCandidateSkillCommand)
export class AddCandidateSkillHandler implements ICommandHandler<AddCandidateSkillCommand> {
  constructor(
    @Inject('ICandidateProfileRepository')
    private readonly profileRepository: ICandidateProfileRepository,
    @Inject('ISkillReadRepository')
    private readonly skillReadRepository: ISkillReadRepository,
    private readonly eventBus: EventBus,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: AddCandidateSkillCommand): Promise<{ candidateSkillId: string }> {
    this.logger.info('Adding skill to candidate profile', {
      candidateId: command.candidateId,
      skillId: command.skillId,
    });

    // 1. Check if skill exists and is active
    const skill = await this.skillReadRepository.findById(command.skillId);
    if (!skill) {
      throw new NotFoundException(`Skill with ID "${command.skillId}" not found`);
    }
    if (!skill.isActive) {
      throw new BadRequestException(`Skill "${skill.name}" is not active and cannot be added`);
    }

    // 2. Find candidate profile
    const profile = await this.profileRepository.findByUserId(command.candidateId);
    if (!profile) {
      throw new NotFoundException(`Candidate profile for user "${command.candidateId}" not found`);
    }

    // 3. Check if skill already exists in profile
    const hasSkill = await this.profileRepository.hasSkill(command.candidateId, command.skillId);
    if (hasSkill) {
      throw new ConflictException(`Skill "${skill.name}" is already in your profile`);
    }

    // 4. Create value objects (null means not specified)
    const proficiency = command.proficiencyLevel
      ? ProficiencyLevel.fromString(command.proficiencyLevel)
      : null;
    const years = command.yearsOfExperience !== null
      ? YearsOfExperience.fromNumber(command.yearsOfExperience)
      : null;

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
    profile.commit();

    this.logger.info('Skill added to candidate profile successfully', {
      candidateId: command.candidateId,
      skillId: command.skillId,
      candidateSkillId,
    });

    return { candidateSkillId };
  }
}
