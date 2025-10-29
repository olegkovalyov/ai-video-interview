/**
 * Domain Event: User Deleted
 * Published when a user is soft-deleted
 */
export class UserDeletedEvent {
  constructor(
    public readonly userId: string,
    public readonly deletedBy: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
