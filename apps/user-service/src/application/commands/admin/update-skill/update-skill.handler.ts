import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { UpdateSkillCommand } from './update-skill.command';
import type { ISkillRepository } from '../../../../domain/repositories/skill.repository.interface';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';

@CommandHandler(UpdateSkillCommand)
export class UpdateSkillHandler implements ICommandHandler<UpdateSkillCommand> {
  constructor(
    @Inject('ISkillRepository')
    private readonly skillRepository: ISkillRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: UpdateSkillCommand): Promise<void> {
    this.logger.info('Updating skill', { skillId: command.skillId });

    // 1. Find skill
    const skill = await this.skillRepository.findById(command.skillId);
    if (!skill) {
      throw new NotFoundException(`Skill with ID "${command.skillId}" not found`);
    }

    // 2. If categoryId provided, verify it exists
    if (command.categoryId) {
      const categoryExists = await this.skillRepository.categoryExists(command.categoryId);
      if (!categoryExists) {
        throw new ConflictException(`Skill category "${command.categoryId}" not found`);
      }
    }

    // 3. Update skill
    skill.update(command.name, command.description, command.categoryId);

    // 4. Save
    await this.skillRepository.save(skill);

    this.logger.info('Skill updated successfully', { skillId: command.skillId });
  }
}
