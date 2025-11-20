export class UpdateCompanyCommand {
  constructor(
    public readonly companyId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly website: string | null,
    public readonly logoUrl: string | null,
    public readonly industry: string | null,
    public readonly size: string | null,
    public readonly location: string | null,
    public readonly userId: string, // HR who is updating
  ) {}
}
