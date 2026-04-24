import { Query } from '@nestjs/cqrs';
import type { SkillsByCategoryReadModel } from '../../../domain/read-models/candidate-profile.read-model';

export class GetCandidateSkillsQuery extends Query<
  SkillsByCategoryReadModel[]
> {
  constructor(
    public readonly candidateId: string,
    public readonly currentUserId?: string,
    public readonly isHR?: boolean,
    public readonly isAdmin?: boolean,
  ) {
    super();
  }
}
