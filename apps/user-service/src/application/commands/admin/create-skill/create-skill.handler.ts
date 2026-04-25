import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { CreateSkillCommand } from './create-skill.command';
import { SkillCreationService } from '../../../services/skill-creation.service';

/**
 * Thin CQRS adapter over {@link SkillCreationService}.
 */
@Injectable()
@CommandHandler(CreateSkillCommand)
export class CreateSkillHandler implements ICommandHandler<CreateSkillCommand> {
  constructor(private readonly skillCreation: SkillCreationService) {}

  execute(command: CreateSkillCommand): Promise<{ skillId: string }> {
    return this.skillCreation.create({
      name: command.name,
      slug: command.slug,
      categoryId: command.categoryId,
      description: command.description,
      adminId: command.adminId,
    });
  }
}
