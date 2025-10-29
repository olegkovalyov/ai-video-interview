/**
 * Activate User Command
 * Represents the intent to activate a suspended user account
 */
export class ActivateUserCommand {
  constructor(public readonly userId: string) {}
}
