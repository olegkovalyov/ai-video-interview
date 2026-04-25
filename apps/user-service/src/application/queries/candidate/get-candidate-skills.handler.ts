import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCandidateSkillsQuery } from './get-candidate-skills.query';
import type { ICandidateProfileQueryService } from '../../../domain/repositories/candidate-profile-query-service.interface';
import type { SkillsByCategoryReadModel } from '../../../domain/read-models/candidate-profile.read-model';
import { AccessDeniedException } from '../../../domain/exceptions/access-denied.exception';

/**
 * Get Candidate Skills Query Handler
 * Returns Read Models (plain objects) grouped by category
 */
@QueryHandler(GetCandidateSkillsQuery)
export class GetCandidateSkillsHandler
  implements IQueryHandler<GetCandidateSkillsQuery>
{
  constructor(
    @Inject('ICandidateProfileQueryService')
    private readonly profileQueryService: ICandidateProfileQueryService,
  ) {}

  async execute(
    query: GetCandidateSkillsQuery,
  ): Promise<SkillsByCategoryReadModel[]> {
    // Check permissions: own profile, HR, or ADMIN
    const canView =
      query.candidateId === query.currentUserId || query.isHR || query.isAdmin;

    if (!canView) {
      throw new AccessDeniedException(
        'You do not have permission to view this candidate profile',
      );
    }

    return this.profileQueryService.getCandidateSkillsGroupedByCategory(
      query.candidateId,
    );
  }
}
