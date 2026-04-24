import { Query } from '@nestjs/cqrs';
import type { CandidateProfileWithUserReadModel } from '../../../domain/read-models/candidate-profile.read-model';

export class GetCandidateProfileQuery extends Query<CandidateProfileWithUserReadModel> {
  constructor(
    public readonly userId: string,
    public readonly currentUserId?: string,
    public readonly isHR?: boolean,
    public readonly isAdmin?: boolean,
  ) {
    super();
  }
}
