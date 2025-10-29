/**
 * Suspend User Command
 * Represents the intent to suspend a user account
 */
export class SuspendUserCommand {
  constructor(
    public readonly userId: string,
    public readonly reason: string,
    public readonly suspendedBy: string,
  ) {}
}
