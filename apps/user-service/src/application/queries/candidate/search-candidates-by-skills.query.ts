import { Query } from '@nestjs/cqrs';
import type { PaginatedResult } from '../../../domain/repositories/candidate-profile-read.repository.interface';
import type { CandidateSearchResultReadModel } from '../../../domain/read-models/candidate-profile.read-model';

export interface SearchCandidatesBySkillsQueryProps {
  skillIds: string[];
  minProficiency?: string;
  minYears?: number;
  experienceLevel?: string;
  page?: number;
  limit?: number;
}

export class SearchCandidatesBySkillsQuery extends Query<
  PaginatedResult<CandidateSearchResultReadModel>
> {
  public readonly skillIds: string[];
  public readonly minProficiency?: string;
  public readonly minYears?: number;
  public readonly experienceLevel?: string;
  public readonly page: number;
  public readonly limit: number;

  constructor(props: SearchCandidatesBySkillsQueryProps) {
    super();
    this.skillIds = props.skillIds;
    this.minProficiency = props.minProficiency;
    this.minYears = props.minYears;
    this.experienceLevel = props.experienceLevel;
    this.page = props.page ?? 1;
    this.limit = props.limit ?? 20;
  }
}
