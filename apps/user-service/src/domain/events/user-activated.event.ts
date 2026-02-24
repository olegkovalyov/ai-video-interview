import type { IDomainEvent } from './domain-event.interface';

/**
 * Domain Event: User Activated
 * Published when a suspended user account is reactivated
 */
export class UserActivatedEvent implements IDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly previousStatus: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
