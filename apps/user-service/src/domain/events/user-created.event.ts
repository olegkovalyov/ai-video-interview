import type { IDomainEvent } from './domain-event.interface';

/**
 * Construction args for {@link UserCreatedEvent}. `occurredAt` defaults to now.
 */
export interface UserCreatedEventProps {
  userId: string;
  email: string;
  externalAuthId: string;
  firstName: string;
  lastName: string;
  occurredAt?: Date;
}

/**
 * Domain Event: User Created.
 * Published when a new user is created in the system.
 *
 * Constructed via a props object so adding a 6th field (e.g., `language`)
 * does not break call-site positional ordering.
 */
export class UserCreatedEvent implements IDomainEvent {
  public readonly userId: string;
  public readonly email: string;
  public readonly externalAuthId: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly occurredAt: Date;

  constructor(props: UserCreatedEventProps) {
    this.userId = props.userId;
    this.email = props.email;
    this.externalAuthId = props.externalAuthId;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.occurredAt = props.occurredAt ?? new Date();
  }
}
