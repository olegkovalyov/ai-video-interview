/**
 * Domain Event: Role Removed
 * Published when a role is removed from a user
 */
export class RoleRemovedEvent {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly roleName: string,
    public readonly removedBy: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
