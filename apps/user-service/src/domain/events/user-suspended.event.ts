import type { IDomainEvent } from './domain-event.interface';

/**
 * Domain Event: User Suspended
 * Published when a user account is suspended
 */
export class UserSuspendedEvent implements IDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly reason: string,
    public readonly suspendedBy: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
