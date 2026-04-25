import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCompanyCommand } from './create-company.command';
import { CompanyCreationService } from '../../../services/company-creation.service';

/**
 * Thin CQRS adapter over {@link CompanyCreationService}.
 */
@CommandHandler(CreateCompanyCommand)
export class CreateCompanyHandler
  implements ICommandHandler<CreateCompanyCommand>
{
  constructor(private readonly companyCreation: CompanyCreationService) {}

  execute(command: CreateCompanyCommand): Promise<{ companyId: string }> {
    return this.companyCreation.create({
      name: command.name,
      description: command.description,
      website: command.website,
      logoUrl: command.logoUrl,
      industry: command.industry,
      size: command.size,
      location: command.location,
      position: command.position,
      createdBy: command.createdBy,
    });
  }
}
