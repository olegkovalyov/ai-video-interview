import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DeactivateSkillCommand } from './deactivate-skill.command';
import type { ISkillRepository } from '../../../../domain/repositories/skill.repository.interface';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';

@CommandHandler(DeactivateSkillCommand)
export class DeactivateSkillHandler implements ICommandHandler<DeactivateSkillCommand> {
  constructor(
    @Inject('ISkillRepository')
    private readonly skillRepository: ISkillRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: DeactivateSkillCommand): Promise<void> {
    const skill = await this.skillRepository.findById(command.skillId);
    if (!skill) {
      throw new NotFoundException(`Skill with ID "${command.skillId}" not found`);
    }

    skill.deactivate();
    await this.skillRepository.save(skill);

    this.logger.info('Skill deactivated', { skillId: command.skillId });
  }
}
