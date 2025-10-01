/**
 * Update User Command
 * Represents the intent to update user profile
 */
export class UpdateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly bio?: string,
    public readonly phone?: string,
  ) {}
}
