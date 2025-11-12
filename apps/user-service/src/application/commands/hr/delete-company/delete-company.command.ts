export class DeleteCompanyCommand {
  constructor(
    public readonly companyId: string,
    public readonly userId: string, // HR who is deleting (must be creator)
  ) {}
}
