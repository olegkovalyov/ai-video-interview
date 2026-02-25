import type { IDomainEvent } from './domain-event.interface';

/**
 * Typed changes for CompanyUpdatedEvent
 */
export interface CompanyChanges {
  name?: string;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  industry?: string | null;
  size?: string | null;
  location?: string | null;
}

/**
 * Domain Event: Company Updated
 * Published when company information is updated
 */
export class CompanyUpdatedEvent implements IDomainEvent {
  constructor(
    public readonly companyId: string,
    public readonly changes: CompanyChanges,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
