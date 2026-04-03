export class CheckQuotaQuery {
  constructor(
    public readonly companyId: string,
    public readonly resource: string, // 'interviews' | 'templates' | 'teamMembers'
  ) {}
}
