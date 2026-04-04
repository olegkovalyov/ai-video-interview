import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateSkillCommand } from './activate-skill.command';
import type { ISkillRepository } from '../../../../domain/repositories/skill.repository.interface';
import { SkillNotFoundException } from '../../../../domain/exceptions/skill.exceptions';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';

@CommandHandler(ActivateSkillCommand)
export class ActivateSkillHandler
  implements ICommandHandler<ActivateSkillCommand>
{
  constructor(
    @Inject('ISkillRepository')
    private readonly skillRepository: ISkillRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: ActivateSkillCommand): Promise<void> {
    const skill = await this.skillRepository.findById(command.skillId);
    if (!skill) {
      throw new SkillNotFoundException(command.skillId);
    }

    skill.activate();
    await this.skillRepository.save(skill);

    this.logger.info('Skill activated', { skillId: command.skillId });
  }
}
