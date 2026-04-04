import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteSkillCommand } from './delete-skill.command';
import type { ISkillRepository } from '../../../../domain/repositories/skill.repository.interface';
import { SkillNotFoundException } from '../../../../domain/exceptions/skill.exceptions';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';

/**
 * Delete Skill Command Handler
 * Hard delete - CASCADE will remove all candidate_skills
 */
@CommandHandler(DeleteSkillCommand)
export class DeleteSkillHandler implements ICommandHandler<DeleteSkillCommand> {
  constructor(
    @Inject('ISkillRepository')
    private readonly skillRepository: ISkillRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: DeleteSkillCommand): Promise<void> {
    this.logger.warn('Hard deleting skill (CASCADE)', {
      skillId: command.skillId,
      adminId: command.adminId,
    });

    // 1. Check if skill exists
    const skill = await this.skillRepository.findById(command.skillId);
    if (!skill) {
      throw new SkillNotFoundException(command.skillId);
    }

    // 2. Hard delete (CASCADE removes candidate_skills)
    await this.skillRepository.delete(command.skillId);

    this.logger.warn('Skill deleted permanently', { skillId: command.skillId });
  }
}
