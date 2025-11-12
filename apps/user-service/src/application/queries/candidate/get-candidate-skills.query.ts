export class GetCandidateSkillsQuery {
  constructor(
    public readonly candidateId: string,
    public readonly currentUserId?: string,
    public readonly isHR?: boolean,
    public readonly isAdmin?: boolean,
  ) {}
}
