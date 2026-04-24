import { Command } from '@nestjs/cqrs';

export class CreateCompanyCommand extends Command<{ companyId: string }> {
  constructor(
    public readonly name: string,
    public readonly description: string | null,
    public readonly website: string | null,
    public readonly logoUrl: string | null,
    public readonly industry: string | null,
    public readonly size: string | null,
    public readonly location: string | null,
    public readonly position: string | null,
    public readonly createdBy: string,
  ) {
    super();
  }
}
