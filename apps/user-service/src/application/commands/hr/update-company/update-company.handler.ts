import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateCompanyCommand } from './update-company.command';
import { CompanySize } from '../../../../domain/value-objects/company-size.vo';
import type { ICompanyRepository } from '../../../../domain/repositories/company.repository.interface';
import { CompanyNotFoundException, CompanyAccessDeniedException } from '../../../../domain/exceptions/company.exceptions';
import { COMPANY_EVENT_TYPES } from '../../../../domain/constants';
import type { IOutboxService } from '../../../ports/outbox-service.port';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';

/**
 * Update Company Command Handler
 * Only company creator can update
 */
@CommandHandler(UpdateCompanyCommand)
export class UpdateCompanyHandler implements ICommandHandler<UpdateCompanyCommand> {
  constructor(
    @Inject('ICompanyRepository')
    private readonly companyRepository: ICompanyRepository,
    private readonly eventBus: EventBus,
    @Inject('IOutboxService')
    private readonly outboxService: IOutboxService,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: UpdateCompanyCommand): Promise<void> {
    this.logger.info('Updating company', { companyId: command.companyId });

    // 1. Find company
    const company = await this.companyRepository.findById(command.companyId);
    if (!company) {
      throw new CompanyNotFoundException(command.companyId);
    }

    // 2. Check permissions - only creator can update
    if (company.createdBy !== command.userId) {
      throw new CompanyAccessDeniedException('Only company creator can update company information');
    }

    // 3. Parse company size (null/empty means remove size)
    const companySize: CompanySize | null = command.size
      ? CompanySize.fromString(command.size)
      : null;

    // 4. Update company
    company.update(
      command.name,
      command.description,
      command.website,
      command.logoUrl,
      command.industry,
      companySize,
      command.location,
    );

    // 5. Save
    await this.companyRepository.save(company);

    // 6. Publish domain events (internal)
    const events = company.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    company.clearEvents();

    // 7. Publish integration event to Kafka
    await this.outboxService.saveEvent(
      COMPANY_EVENT_TYPES.UPDATED,
      {
        companyId: command.companyId,
        name: company.name,
        updatedAt: new Date().toISOString(),
      },
      command.companyId,
    );

    this.logger.info('Company updated successfully', { companyId: command.companyId });
  }
}
