/**
 * Domain Event: Role Assigned
 * Published when a role is assigned to a user
 */
export class RoleAssignedEvent {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly roleName: string,
    public readonly assignedBy: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
