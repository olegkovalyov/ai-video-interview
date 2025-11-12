import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteCompanyCommand } from './delete-company.command';
import type { ICompanyRepository } from '../../../../domain/repositories/company.repository.interface';
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
      throw new NotFoundException(`Company with ID "${command.companyId}" not found`);
    }

    // 2. Check permissions - only creator can delete
    if (company.createdBy !== command.userId) {
      throw new ForbiddenException('Only company creator can delete the company');
    }

    // 3. Hard delete (CASCADE removes user_companies)
    await this.companyRepository.delete(command.companyId);

    this.logger.warn('Company deleted permanently', { companyId: command.companyId });
  }
}
