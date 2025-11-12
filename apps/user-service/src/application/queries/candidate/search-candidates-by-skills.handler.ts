import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SearchCandidatesBySkillsQuery } from './search-candidates-by-skills.query';
import type { 
  ICandidateProfileReadRepository,
  CandidateSearchFilters,
  CandidateSearchResult,
  PaginatedResult,
} from '../../../domain/repositories/candidate-profile-read.repository.interface';

@QueryHandler(SearchCandidatesBySkillsQuery)
export class SearchCandidatesBySkillsHandler implements IQueryHandler<SearchCandidatesBySkillsQuery> {
  constructor(
    @Inject('ICandidateProfileReadRepository')
    private readonly profileReadRepository: ICandidateProfileReadRepository,
  ) {}

  async execute(query: SearchCandidatesBySkillsQuery): Promise<PaginatedResult<CandidateSearchResult>> {
    const filters: CandidateSearchFilters = {
      skillIds: query.skillIds,
      minProficiency: query.minProficiency,
      minYears: query.minYears,
      experienceLevel: query.experienceLevel,
    };

    return this.profileReadRepository.searchBySkills(filters, query.page, query.limit);
  }
}
