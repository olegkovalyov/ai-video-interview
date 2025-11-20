export class GetCandidateProfileQuery {
  constructor(
    public readonly userId: string,
    public readonly currentUserId?: string,
    public readonly isHR?: boolean,
    public readonly isAdmin?: boolean,
  ) {}
}
