/**
 * Assign Role Command
 * Represents the intent to assign a role to a user
 */
export class AssignRoleCommand {
  constructor(
    public readonly userId: string,
    public readonly roleName: string,
    public readonly assignedBy?: string,
  ) {}
}
