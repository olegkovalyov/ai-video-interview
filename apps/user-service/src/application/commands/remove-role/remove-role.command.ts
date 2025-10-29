/**
 * Remove Role Command
 * Represents the intent to remove a role from a user
 */
export class RemoveRoleCommand {
  constructor(
    public readonly userId: string,
    public readonly roleName: string,
    public readonly removedBy?: string,
  ) {}
}
