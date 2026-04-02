export class ListInvoicesQuery {
  constructor(
    public readonly companyId: string,
    public readonly limit?: number,
  ) {}
}
