/**
 * Command: Create Company
 * HR creates a new company in the system
 */
export class CreateCompanyCommand {
  constructor(
    public readonly name: string,
    public readonly description: string | null,
    public readonly website: string | null,
    public readonly logoUrl: string | null,
    public readonly industry: string | null,
    public readonly size: string | null,
    public readonly location: string | null,
    public readonly position: string | null, // Creator's position
    public readonly createdBy: string, // HR userId
  ) {}
}
