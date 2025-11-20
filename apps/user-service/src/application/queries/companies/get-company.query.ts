export class GetCompanyQuery {
  constructor(
    public readonly companyId: string,
    public readonly currentUserId?: string,
    public readonly isAdmin?: boolean,
  ) {}
}
