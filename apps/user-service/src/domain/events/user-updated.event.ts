/**
 * Domain Event: User Updated
 * Published when user data is modified
 */
export class UserUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly changes: Record<string, any>,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
