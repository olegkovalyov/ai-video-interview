import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateCandidateProfileCommand } from './update-candidate-profile.command';
import type { ICandidateProfileRepository } from '../../../domain/repositories/candidate-profile.repository.interface';
import { ExperienceLevel } from '../../../domain/value-objects/experience-level.vo';

/**
 * UpdateCandidateProfile Command Handler
 * Updates candidate profile with new skills and/or experience level
 */
@Injectable()
@CommandHandler(UpdateCandidateProfileCommand)
export class UpdateCandidateProfileHandler implements ICommandHandler<UpdateCandidateProfileCommand> {
  constructor(
    @Inject('ICandidateProfileRepository')
    private readonly repository: ICandidateProfileRepository,
  ) {}

  async execute(command: UpdateCandidateProfileCommand): Promise<void> {
    const { userId, skills, experienceLevel } = command;

    // 1. Get profile
    const profile = await this.repository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException(`Candidate profile for user ${userId} not found`);
    }

    // 2. Update skills if provided
    if (skills !== undefined) {
      profile.updateSkills(skills);
    }

    // 3. Update experience level if provided
    if (experienceLevel !== undefined) {
      const level = ExperienceLevel.fromString(experienceLevel);
      profile.updateExperienceLevel(level);
    }

    // 4. Save (isProfileComplete is calculated automatically)
    await this.repository.save(profile);
  }
}
