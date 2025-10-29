/**
 * Create User Command
 * Represents the intent to create a new user
 */
export class CreateUserCommand {
  constructor(
    public readonly keycloakId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
  ) {}
}
