import { Command } from '@nestjs/cqrs';

export class DeleteCompanyCommand extends Command<void> {
  constructor(
    public readonly companyId: string,
    public readonly userId: string,
  ) {
    super();
  }
}
