import { Query } from '@nestjs/cqrs';
import type { PaginatedResult } from '../../../domain/repositories/candidate-profile-read.repository.interface';
import type { CandidateSearchResultReadModel } from '../../../domain/read-models/candidate-profile.read-model';

export class SearchCandidatesBySkillsQuery extends Query<
  PaginatedResult<CandidateSearchResultReadModel>
> {
  constructor(
    public readonly skillIds: string[],
    public readonly minProficiency?: string,
    public readonly minYears?: number,
    public readonly experienceLevel?: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {
    super();
  }
}
