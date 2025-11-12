/**
 * Domain Event: Company Updated
 * Published when company information is updated
 */
export class CompanyUpdatedEvent {
  constructor(
    public readonly companyId: string,
    public readonly changes: Record<string, any>,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
