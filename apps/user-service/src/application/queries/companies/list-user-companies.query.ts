export class ListUserCompaniesQuery {
  constructor(
    public readonly userId: string,
    public readonly currentUserId?: string,
    public readonly isAdmin?: boolean,
  ) {}
}
