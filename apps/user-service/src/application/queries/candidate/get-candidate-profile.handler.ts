import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetCandidateProfileQuery } from './get-candidate-profile.query';
import type { ICandidateProfileReadRepository } from '../../../domain/repositories/candidate-profile-read.repository.interface';
import type { CandidateProfileWithUserReadModel } from '../../../domain/read-models/candidate-profile.read-model';

/**
 * Get Candidate Profile Query Handler
 * Returns Read Model (plain object) - no domain entity
 */
@QueryHandler(GetCandidateProfileQuery)
export class GetCandidateProfileHandler implements IQueryHandler<GetCandidateProfileQuery> {
  constructor(
    @Inject('ICandidateProfileReadRepository')
    private readonly profileReadRepository: ICandidateProfileReadRepository,
  ) {}

  async execute(query: GetCandidateProfileQuery): Promise<CandidateProfileWithUserReadModel> {
    // Check permissions: own profile, HR, or ADMIN
    const canView = 
      query.userId === query.currentUserId ||
      query.isHR ||
      query.isAdmin;

    if (!canView) {
      throw new ForbiddenException('You do not have permission to view this candidate profile');
    }

    const profile = await this.profileReadRepository.findByUserIdWithUser(query.userId);
    
    if (!profile) {
      throw new NotFoundException(`Candidate profile for user "${query.userId}" not found`);
    }

    return profile;
  }
}
