import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListSkillCategoriesQuery } from './list-categories.query';
import type { ISkillReadRepository } from '../../../../domain/repositories/skill-read.repository.interface';
import type { SkillCategoryReadModel } from '../../../../domain/read-models/skill.read-model';

/**
 * List Skill Categories Query Handler
 * Returns Read Models (plain objects)
 */
@QueryHandler(ListSkillCategoriesQuery)
export class ListSkillCategoriesHandler implements IQueryHandler<ListSkillCategoriesQuery> {
  constructor(
    @Inject('ISkillReadRepository')
    private readonly skillReadRepository: ISkillReadRepository,
  ) {}

  async execute(query: ListSkillCategoriesQuery): Promise<SkillCategoryReadModel[]> {
    return this.skillReadRepository.listCategories();
  }
}
