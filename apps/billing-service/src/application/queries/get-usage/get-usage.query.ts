export class GetUsageQuery {
  constructor(
    public readonly companyId: string,
    public readonly period?: string, // 'YYYY-MM', defaults to current
  ) {}
}
