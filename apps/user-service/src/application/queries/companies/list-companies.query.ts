export class ListCompaniesQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 50,
    public readonly isActive?: boolean,
    public readonly search?: string,
    public readonly createdBy?: string,
    public readonly currentUserId?: string, // For filtering HR's own companies
    public readonly isAdmin?: boolean, // If true, see all companies
  ) {}
}
