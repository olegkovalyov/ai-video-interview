/**
 * Domain Event: Company Deactivated
 * Published when a company is deactivated
 */
export class CompanyDeactivatedEvent {
  constructor(
    public readonly companyId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
