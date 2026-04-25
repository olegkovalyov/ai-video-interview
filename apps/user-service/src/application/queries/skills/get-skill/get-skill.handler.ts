import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetSkillQuery } from './get-skill.query';
import type { ISkillReadRepository } from '../../../../domain/repositories/skill-read.repository.interface';
import type { SkillWithCategoryReadModel } from '../../../../domain/read-models/skill.read-model';
import { SkillNotFoundException } from '../../../../domain/exceptions/skill.exceptions';

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
    const result = await this.skillReadRepository.findByIdWithCategory(
      query.skillId,
    );

    if (!result) {
      throw new SkillNotFoundException(query.skillId);
    }

    return result;
  }
}
