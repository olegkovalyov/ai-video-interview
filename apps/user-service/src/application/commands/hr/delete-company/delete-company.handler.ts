import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteCompanyCommand } from './delete-company.command';
import type { ICompanyRepository } from '../../../../domain/repositories/company.repository.interface';
import { CompanyNotFoundException, CompanyAccessDeniedException } from '../../../../domain/exceptions/company.exceptions';
import { COMPANY_EVENT_TYPES } from '../../../../domain/constants';
import type { IOutboxService } from '../../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../../interfaces/unit-of-work.interface';
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
    @Inject('IUnitOfWork')
    private readonly unitOfWork: IUnitOfWork,
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

    // 3. Atomic: outbox save + hard delete in same transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      const eid = await this.outboxService.saveEvent(
        COMPANY_EVENT_TYPES.DELETED,
        {
          companyId: command.companyId,
          deletedBy: command.userId,
          deletedAt: new Date().toISOString(),
        },
        command.companyId,
        tx,
      );
      await this.companyRepository.delete(command.companyId, tx);
      return eid;
    });

    // 4. Schedule BullMQ job for Kafka publishing
    await this.outboxService.schedulePublishing([eventId]);

    this.logger.warn('Company deleted permanently', { companyId: command.companyId });
  }
}
