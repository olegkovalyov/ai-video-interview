import type { IDomainEvent } from './domain-event.interface';

/**
 * Typed changes for UserUpdatedEvent
 */
export interface UserProfileChanges {
  fullName?: { firstName: string; lastName: string };
  email?: string;
  emailVerified?: boolean;
  bio?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  avatarUrl?: string | null;
  role?: string;
}

/**
 * Domain Event: User Updated
 * Published when user data is modified
 */
export class UserUpdatedEvent implements IDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly changes: UserProfileChanges,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
