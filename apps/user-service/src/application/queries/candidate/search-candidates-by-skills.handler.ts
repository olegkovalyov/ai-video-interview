import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SearchCandidatesBySkillsQuery } from './search-candidates-by-skills.query';
import type {
  ICandidateProfileQueryService,
  CandidateSearchFilters,
  PaginatedResult,
} from '../../../domain/repositories/candidate-profile-query-service.interface';
import type { CandidateSearchResultReadModel } from '../../../domain/read-models/candidate-profile.read-model';

/**
 * Search Candidates By Skills Query Handler
 * Returns Read Models (plain objects) with match scores
 */
@QueryHandler(SearchCandidatesBySkillsQuery)
export class SearchCandidatesBySkillsHandler
  implements IQueryHandler<SearchCandidatesBySkillsQuery>
{
  constructor(
    @Inject('ICandidateProfileQueryService')
    private readonly profileQueryService: ICandidateProfileQueryService,
  ) {}

  async execute(
    query: SearchCandidatesBySkillsQuery,
  ): Promise<PaginatedResult<CandidateSearchResultReadModel>> {
    const filters: CandidateSearchFilters = {
      skillIds: query.skillIds,
      minProficiency: query.minProficiency,
      minYears: query.minYears,
      experienceLevel: query.experienceLevel,
    };

    return this.profileQueryService.searchBySkills(
      filters,
      query.page,
      query.limit,
    );
  }
}
