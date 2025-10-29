/**
 * Delete User Command
 * Represents the intent to soft-delete a user account
 */
export class DeleteUserCommand {
  constructor(
    public readonly userId: string,
    public readonly deletedBy: string,
  ) {}
}
