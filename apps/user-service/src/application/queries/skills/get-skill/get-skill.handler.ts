import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetSkillQuery } from './get-skill.query';
import type { ISkillReadRepository } from '../../../../domain/repositories/skill-read.repository.interface';
import type { SkillWithCategoryReadModel } from '../../../../domain/read-models/skill.read-model';

/**
 * Get Skill Query Handler
 * Returns Read Model (plain object) with denormalized category data
 */
@QueryHandler(GetSkillQuery)
export class GetSkillHandler implements IQueryHandler<GetSkillQuery> {
  constructor(
    @Inject('ISkillReadRepository')
    private readonly skillReadRepository: ISkillReadRepository,
  ) {}

  async execute(query: GetSkillQuery): Promise<SkillWithCategoryReadModel> {
    const result = await this.skillReadRepository.findByIdWithCategory(query.skillId);
    
    if (!result) {
      throw new NotFoundException(`Skill with ID "${query.skillId}" not found`);
    }

    return result;
  }
}
