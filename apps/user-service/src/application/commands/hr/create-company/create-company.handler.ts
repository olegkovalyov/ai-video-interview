import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateCompanyCommand } from './create-company.command';
import { Company } from '../../../../domain/aggregates/company.aggregate';
import { CompanySize } from '../../../../domain/value-objects/company-size.vo';
import type { ICompanyRepository } from '../../../../domain/repositories/company.repository.interface';
import { COMPANY_EVENT_TYPES } from '../../../../domain/constants';
import type { IOutboxService } from '../../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';
import { v4 as uuid } from 'uuid';

/**
 * Create Company Command Handler
 * HR creates a new company
 */
@CommandHandler(CreateCompanyCommand)
export class CreateCompanyHandler implements ICommandHandler<CreateCompanyCommand> {
  constructor(
    @Inject('ICompanyRepository')
    private readonly companyRepository: ICompanyRepository,
    private readonly eventBus: EventBus,
    @Inject('IOutboxService')
    private readonly outboxService: IOutboxService,
    @Inject('IUnitOfWork')
    private readonly unitOfWork: IUnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: CreateCompanyCommand): Promise<{ companyId: string }> {
    this.logger.info('Creating new company', {
      name: command.name,
      createdBy: command.createdBy,
    });

    // 1. Parse company size if provided
    let companySize: CompanySize | null = null;
    if (command.size) {
      companySize = CompanySize.fromString(command.size);
    }

    // 2. Create Company aggregate
    const companyId = uuid();
    const userCompanyId = uuid();

    const company = Company.create(
      companyId,
      command.name,
      command.description,
      command.website,
      command.logoUrl,
      command.industry,
      companySize,
      command.location,
      command.createdBy,
      userCompanyId,
      command.position,
    );

    // 3. Atomic save: aggregate + outbox in same transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.companyRepository.save(company, tx);
      return this.outboxService.saveEvent(
        COMPANY_EVENT_TYPES.CREATED,
        {
          companyId,
          name: command.name,
          createdBy: command.createdBy,
          createdAt: new Date().toISOString(),
        },
        companyId,
        tx,
      );
    });

    // 4. After commit: publish domain events (internal)
    const events = company.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    company.clearEvents();

    // 5. Schedule BullMQ job for Kafka publishing
    await this.outboxService.schedulePublishing([eventId]);

    this.logger.info('Company created successfully', { companyId, name: command.name });

    return { companyId };
  }
}
