import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListSkillsQuery } from './list-skills.query';
import type { ISkillReadRepository, PaginatedResult, SkillListFilters, SkillWithCategory } from '../../../../domain/repositories/skill-read.repository.interface';

@QueryHandler(ListSkillsQuery)
export class ListSkillsHandler implements IQueryHandler<ListSkillsQuery> {
  constructor(
    @Inject('ISkillReadRepository')
    private readonly skillReadRepository: ISkillReadRepository,
  ) {}

  async execute(query: ListSkillsQuery): Promise<any> {
    const filters: SkillListFilters = {
      search: query.search,
      categoryId: query.categoryId,
      isActive: query.isActive,
    };

    const result = await this.skillReadRepository.listWithCategories(query.page, query.limit, filters);
    
    // Flatten structure for easier consumption
    const flatData = result.data.map(item => ({
      ...item.skill,
      category: item.category,
      categoryName: item.category?.name || null,
    }));

    return {
      ...result,
      data: flatData,
    };
  }
}
