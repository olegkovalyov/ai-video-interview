/**
 * Domain Event: User Created
 * Published when a new user is created in the system
 */
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly keycloakId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
