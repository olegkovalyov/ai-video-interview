import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateCompanyCommand } from './update-company.command';
import { CompanySize } from '../../../../domain/value-objects/company-size.vo';
import type { ICompanyRepository } from '../../../../domain/repositories/company.repository.interface';
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
    private readonly logger: LoggerService,
  ) {}

  async execute(command: UpdateCompanyCommand): Promise<void> {
    this.logger.info('Updating company', { companyId: command.companyId });

    // 1. Find company
    const company = await this.companyRepository.findById(command.companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID "${command.companyId}" not found`);
    }

    // 2. Check permissions - only creator can update
    if (company.createdBy !== command.userId) {
      throw new ForbiddenException('Only company creator can update company information');
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

    // 6. Publish domain events
    const events = company.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    company.commit();

    this.logger.info('Company updated successfully', { companyId: command.companyId });
  }
}
