import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCompanyCommand } from './update-company.command';
import { CompanyUpdateService } from '../../../services/company-update.service';

/**
 * Thin CQRS adapter over {@link CompanyUpdateService}.
 */
@CommandHandler(UpdateCompanyCommand)
export class UpdateCompanyHandler
  implements ICommandHandler<UpdateCompanyCommand>
{
  constructor(private readonly companyUpdate: CompanyUpdateService) {}

  execute(command: UpdateCompanyCommand): Promise<void> {
    return this.companyUpdate.update({
      companyId: command.companyId,
      name: command.name,
      description: command.description,
      website: command.website,
      logoUrl: command.logoUrl,
      industry: command.industry,
      size: command.size,
      location: command.location,
      userId: command.userId,
    });
  }
}
