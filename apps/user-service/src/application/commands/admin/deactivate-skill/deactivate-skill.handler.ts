import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeactivateSkillCommand } from './deactivate-skill.command';
import type { ISkillRepository } from '../../../../domain/repositories/skill.repository.interface';
import { SkillNotFoundException } from '../../../../domain/exceptions/skill.exceptions';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';

@CommandHandler(DeactivateSkillCommand)
export class DeactivateSkillHandler
  implements ICommandHandler<DeactivateSkillCommand>
{
  constructor(
    @Inject('ISkillRepository')
    private readonly skillRepository: ISkillRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: DeactivateSkillCommand): Promise<void> {
    const skill = await this.skillRepository.findById(command.skillId);
    if (!skill) {
      throw new SkillNotFoundException(command.skillId);
    }

    skill.deactivate();
    await this.skillRepository.save(skill);

    this.logger.info('Skill deactivated', { skillId: command.skillId });
  }
}
