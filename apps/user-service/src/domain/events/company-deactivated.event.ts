import type { IDomainEvent } from './domain-event.interface';

/**
 * Domain Event: Company Deactivated
 * Published when a company is deactivated
 */
export class CompanyDeactivatedEvent implements IDomainEvent {
  constructor(
    public readonly companyId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
