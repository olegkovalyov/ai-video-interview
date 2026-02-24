import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteCompanyCommand } from './delete-company.command';
import type { ICompanyRepository } from '../../../../domain/repositories/company.repository.interface';
import { CompanyNotFoundException, CompanyAccessDeniedException } from '../../../../domain/exceptions/company.exceptions';
import { COMPANY_EVENT_TYPES } from '../../../../domain/constants';
import type { IOutboxService } from '../../../ports/outbox-service.port';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';

/**
 * Delete Company Command Handler
 * Hard delete - CASCADE will remove all user_companies
 * Only company creator can delete
 */
@CommandHandler(DeleteCompanyCommand)
export class DeleteCompanyHandler implements ICommandHandler<DeleteCompanyCommand> {
  constructor(
    @Inject('ICompanyRepository')
    private readonly companyRepository: ICompanyRepository,
    @Inject('IOutboxService')
    private readonly outboxService: IOutboxService,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: DeleteCompanyCommand): Promise<void> {
    this.logger.warn('Hard deleting company (CASCADE)', {
      companyId: command.companyId,
      userId: command.userId,
    });

    // 1. Find company
    const company = await this.companyRepository.findById(command.companyId);
    if (!company) {
      throw new CompanyNotFoundException(command.companyId);
    }

    // 2. Check permissions - only creator can delete
    if (company.createdBy !== command.userId) {
      throw new CompanyAccessDeniedException('Only company creator can delete the company');
    }

    // 3. Hard delete (CASCADE removes user_companies)
    await this.companyRepository.delete(command.companyId);

    // 4. Publish integration event to Kafka
    await this.outboxService.saveEvent(
      COMPANY_EVENT_TYPES.DELETED,
      {
        companyId: command.companyId,
        deletedBy: command.userId,
        deletedAt: new Date().toISOString(),
      },
      command.companyId,
    );

    this.logger.warn('Company deleted permanently', { companyId: command.companyId });
  }
}
