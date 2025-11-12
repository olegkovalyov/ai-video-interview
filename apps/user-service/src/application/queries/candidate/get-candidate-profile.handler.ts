import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetCandidateProfileQuery } from './get-candidate-profile.query';
import type { 
  ICandidateProfileReadRepository,
  CandidateProfileWithUser,
} from '../../../domain/repositories/candidate-profile-read.repository.interface';

@QueryHandler(GetCandidateProfileQuery)
export class GetCandidateProfileHandler implements IQueryHandler<GetCandidateProfileQuery> {
  constructor(
    @Inject('ICandidateProfileReadRepository')
    private readonly profileReadRepository: ICandidateProfileReadRepository,
  ) {}

  async execute(query: GetCandidateProfileQuery): Promise<CandidateProfileWithUser> {
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
