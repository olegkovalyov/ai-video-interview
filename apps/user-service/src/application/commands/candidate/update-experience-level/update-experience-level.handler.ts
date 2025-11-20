import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateCandidateExperienceLevelCommand } from './update-experience-level.command';
import { ExperienceLevel } from '../../../../domain/value-objects/experience-level.vo';
import type { ICandidateProfileRepository } from '../../../../domain/repositories/candidate-profile.repository.interface';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';

@CommandHandler(UpdateCandidateExperienceLevelCommand)
export class UpdateCandidateExperienceLevelHandler
  implements ICommandHandler<UpdateCandidateExperienceLevelCommand>
{
  constructor(
    @Inject('ICandidateProfileRepository')
    private readonly profileRepository: ICandidateProfileRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: UpdateCandidateExperienceLevelCommand): Promise<void> {
    this.logger.info('Updating candidate experience level', {
      candidateId: command.candidateId,
      experienceLevel: command.experienceLevel,
    });

    // 1. Find candidate profile
    const profile = await this.profileRepository.findByUserId(command.candidateId);
    if (!profile) {
      throw new NotFoundException(`Candidate profile for user "${command.candidateId}" not found`);
    }

    // 2. Create value object
    const experienceLevel = ExperienceLevel.fromString(command.experienceLevel);

    // 3. Update profile
    profile.updateExperienceLevel(experienceLevel);

    // 4. Save profile
    await this.profileRepository.save(profile);

    this.logger.info('Candidate experience level updated successfully', {
      candidateId: command.candidateId,
      experienceLevel: command.experienceLevel,
    });
  }
}
