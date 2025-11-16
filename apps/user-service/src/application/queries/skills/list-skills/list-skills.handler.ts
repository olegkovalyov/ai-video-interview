import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListSkillsQuery } from './list-skills.query';
import type { 
  ISkillReadRepository, 
  PaginatedResult, 
  SkillListFilters 
} from '../../../../domain/repositories/skill-read.repository.interface';
import type { SkillWithCategoryReadModel } from '../../../../domain/read-models/skill.read-model';

/**
 * List Skills Query Handler
 * Returns Read Models (plain objects) - no domain entities
 * Repository already provides denormalized data optimized for display
 */
@QueryHandler(ListSkillsQuery)
export class ListSkillsHandler implements IQueryHandler<ListSkillsQuery> {
  constructor(
    @Inject('ISkillReadRepository')
    private readonly skillReadRepository: ISkillReadRepository,
  ) {}

  async execute(query: ListSkillsQuery): Promise<PaginatedResult<SkillWithCategoryReadModel>> {
    const filters: SkillListFilters = {
      search: query.search,
      categoryId: query.categoryId,
      isActive: query.isActive,
    };

    // Repository returns Read Models (plain objects) with denormalized data
    // No need to transform - just return as is
    return this.skillReadRepository.listWithCategories(query.page, query.limit, filters);
  }
}
