import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateCandidateSkillCommand } from './update-candidate-skill.command';
import { ProficiencyLevel } from '../../../../domain/value-objects/proficiency-level.vo';
import { YearsOfExperience } from '../../../../domain/value-objects/years-of-experience.vo';
import type { ICandidateProfileRepository } from '../../../../domain/repositories/candidate-profile.repository.interface';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';

@CommandHandler(UpdateCandidateSkillCommand)
export class UpdateCandidateSkillHandler implements ICommandHandler<UpdateCandidateSkillCommand> {
  constructor(
    @Inject('ICandidateProfileRepository')
    private readonly profileRepository: ICandidateProfileRepository,
    private readonly eventBus: EventBus,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: UpdateCandidateSkillCommand): Promise<void> {
    this.logger.info('Updating candidate skill', {
      candidateId: command.candidateId,
      skillId: command.skillId,
    });

    // 1. Find candidate profile
    const profile = await this.profileRepository.findByUserId(command.candidateId);
    if (!profile) {
      throw new NotFoundException(`Candidate profile for user "${command.candidateId}" not found`);
    }

    // 2. Create value objects (null means not specified/remove value)
    const proficiency = command.proficiencyLevel
      ? ProficiencyLevel.fromString(command.proficiencyLevel)
      : null;
    const years = command.yearsOfExperience !== null
      ? YearsOfExperience.fromNumber(command.yearsOfExperience)
      : null;

    // 3. Update skill (throws if not found)
    profile.updateSkill(
      command.skillId,
      command.description,
      proficiency,
      years,
    );

    // 4. Save profile
    await this.profileRepository.save(profile);

    // 5. Publish domain events (if any changes)
    const events = profile.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    profile.clearEvents();

    this.logger.info('Candidate skill updated successfully', {
      candidateId: command.candidateId,
      skillId: command.skillId,
    });
  }
}
