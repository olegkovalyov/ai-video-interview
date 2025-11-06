/**
 * SelectRole Command
 * User selects their role (can only be done once!)
 * Admin role can be assigned via internal/admin endpoints
 */
export class SelectRoleCommand {
  constructor(
    public readonly userId: string,
    public readonly role: 'candidate' | 'hr' | 'admin',
  ) {}
}
