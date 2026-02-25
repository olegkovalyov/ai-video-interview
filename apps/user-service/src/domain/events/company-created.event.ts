import type { IDomainEvent } from './domain-event.interface';

/**
 * Domain Event: Company Created
 * Published when a new company is created by an HR user
 */
export class CompanyCreatedEvent implements IDomainEvent {
  constructor(
    public readonly companyId: string,
    public readonly name: string,
    public readonly createdBy: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
