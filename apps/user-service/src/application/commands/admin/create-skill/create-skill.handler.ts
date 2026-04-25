import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateSkillCommand } from './create-skill.command';
import { Skill } from '../../../../domain/entities/skill.entity';
import type { ISkillRepository } from '../../../../domain/repositories/skill.repository.interface';
import {
  SkillAlreadyExistsException,
  SkillCategoryNotFoundException,
} from '../../../../domain/exceptions/skill.exceptions';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';
import { v4 as uuid } from 'uuid';

/**
 * Create Skill Command Handler
 * Admin creates a new skill in the system
 */
@CommandHandler(CreateSkillCommand)
export class CreateSkillHandler implements ICommandHandler<CreateSkillCommand> {
  constructor(
    @Inject('ISkillRepository')
    private readonly skillRepository: ISkillRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: CreateSkillCommand): Promise<{ skillId: string }> {
    this.logger.info('Creating new skill', {
      name: command.name,
      slug: command.slug,
      adminId: command.adminId,
    });

    // 1. Check if skill with this slug already exists
    const existingSkill = await this.skillRepository.findBySlug(command.slug);
    if (existingSkill) {
      throw new SkillAlreadyExistsException(command.slug);
    }

    // 2. If categoryId provided, verify it exists
    if (command.categoryId) {
      const categoryExists = await this.skillRepository.categoryExists(
        command.categoryId,
      );
      if (!categoryExists) {
        throw new SkillCategoryNotFoundException(command.categoryId);
      }
    }

    // 3. Create Skill entity
    const skillId = uuid();
    const skill = Skill.create({
      id: skillId,
      name: command.name,
      slug: command.slug,
      categoryId: command.categoryId,
      description: command.description,
    });

    // 4. Save to repository
    await this.skillRepository.save(skill);

    this.logger.info('Skill created successfully', {
      skillId,
      name: command.name,
    });

    return { skillId };
  }
}
