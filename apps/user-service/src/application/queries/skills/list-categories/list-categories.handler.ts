import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListSkillCategoriesQuery } from './list-categories.query';
import type { ISkillReadRepository } from '../../../../domain/repositories/skill-read.repository.interface';
import { SkillCategory } from '../../../../domain/entities/skill-category.entity';

@QueryHandler(ListSkillCategoriesQuery)
export class ListSkillCategoriesHandler implements IQueryHandler<ListSkillCategoriesQuery> {
  constructor(
    @Inject('ISkillReadRepository')
    private readonly skillReadRepository: ISkillReadRepository,
  ) {}

  async execute(query: ListSkillCategoriesQuery): Promise<SkillCategory[]> {
    return this.skillReadRepository.listCategories();
  }
}
