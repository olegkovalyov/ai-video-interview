import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { DeleteCompanyCommand } from './delete-company.command';
import { CompanyDeletionService } from '../../../services/company-deletion.service';

/**
 * Thin CQRS adapter over {@link CompanyDeletionService}.
 */
@Injectable()
@CommandHandler(DeleteCompanyCommand)
export class DeleteCompanyHandler
  implements ICommandHandler<DeleteCompanyCommand>
{
  constructor(private readonly companyDeletion: CompanyDeletionService) {}

  execute(command: DeleteCompanyCommand): Promise<void> {
    return this.companyDeletion.delete({
      companyId: command.companyId,
      userId: command.userId,
    });
  }
}
