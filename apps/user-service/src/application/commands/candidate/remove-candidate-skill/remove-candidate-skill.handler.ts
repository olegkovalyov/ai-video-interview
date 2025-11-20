import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { RemoveCandidateSkillCommand } from './remove-candidate-skill.command';
import type { ICandidateProfileRepository } from '../../../../domain/repositories/candidate-profile.repository.interface';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';

@CommandHandler(RemoveCandidateSkillCommand)
export class RemoveCandidateSkillHandler implements ICommandHandler<RemoveCandidateSkillCommand> {
  constructor(
    @Inject('ICandidateProfileRepository')
    private readonly profileRepository: ICandidateProfileRepository,
    private readonly eventBus: EventBus,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: RemoveCandidateSkillCommand): Promise<void> {
    this.logger.info('Removing candidate skill', {
      candidateId: command.candidateId,
      skillId: command.skillId,
    });

    // 1. Find candidate profile
    const profile = await this.profileRepository.findByUserId(command.candidateId);
    if (!profile) {
      throw new NotFoundException(`Candidate profile for user "${command.candidateId}" not found`);
    }

    // 2. Remove skill (throws if not found)
    profile.removeSkill(command.skillId);

    // 3. Save profile
    await this.profileRepository.save(profile);

    // 4. Publish domain events
    const events = profile.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    profile.commit();

    this.logger.info('Candidate skill removed successfully', {
      candidateId: command.candidateId,
      skillId: command.skillId,
    });
  }
}
