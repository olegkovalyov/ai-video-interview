import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, ForbiddenException } from '@nestjs/common';
import { GetCandidateSkillsQuery } from './get-candidate-skills.query';
import type { ICandidateProfileReadRepository } from '../../../domain/repositories/candidate-profile-read.repository.interface';
import type { SkillsByCategoryReadModel } from '../../../domain/read-models/candidate-profile.read-model';

/**
 * Get Candidate Skills Query Handler
 * Returns Read Models (plain objects) grouped by category
 */
@QueryHandler(GetCandidateSkillsQuery)
export class GetCandidateSkillsHandler implements IQueryHandler<GetCandidateSkillsQuery> {
  constructor(
    @Inject('ICandidateProfileReadRepository')
    private readonly profileReadRepository: ICandidateProfileReadRepository,
  ) {}

  async execute(query: GetCandidateSkillsQuery): Promise<SkillsByCategoryReadModel[]> {
    // Check permissions: own profile, HR, or ADMIN
    const canView = 
      query.candidateId === query.currentUserId ||
      query.isHR ||
      query.isAdmin;

    if (!canView) {
      throw new ForbiddenException('You do not have permission to view this candidate profile');
    }

    return this.profileReadRepository.getCandidateSkillsGroupedByCategory(query.candidateId);
  }
}
