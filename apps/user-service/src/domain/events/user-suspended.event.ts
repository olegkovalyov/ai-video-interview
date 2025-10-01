/**
 * Domain Event: User Suspended
 * Published when a user account is suspended
 */
export class UserSuspendedEvent {
  constructor(
    public readonly userId: string,
    public readonly reason: string,
    public readonly suspendedBy: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
