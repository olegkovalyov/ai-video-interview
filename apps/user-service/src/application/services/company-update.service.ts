import { Injectable, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Company } from '../../domain/aggregates/company.aggregate';
import { CompanySize } from '../../domain/value-objects/company-size.vo';
import type { ICompanyRepository } from '../../domain/repositories/company.repository.interface';
import {
  CompanyNotFoundException,
  CompanyAccessDeniedException,
} from '../../domain/exceptions/company.exceptions';
import { COMPANY_EVENT_TYPES } from '../../domain/constants';
import type { IOutboxService } from '../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../interfaces/unit-of-work.interface';
import { LoggerService } from '../../infrastructure/logger/logger.service';

export interface UpdateCompanyInput {
  companyId: string;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  /** ID of the user invoking the update — must equal the company creator. */
  userId: string;
}

/**
 * Application service that owns the "update company" use case.
 * Loads the aggregate, checks creator permissions, mutates state, and
 * persists atomically with the integration event.
 */
@Injectable()
export class CompanyUpdateService {
  // 5 deps reflect the use case scope; see UserCreationService for rationale.
  // eslint-disable-next-line max-params
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

  async update(input: UpdateCompanyInput): Promise<void> {
    this.logger.info('Updating company', { companyId: input.companyId });

    const company = await this.loadAndAuthorize(input);

    company.update({
      name: input.name,
      description: input.description,
      website: input.website,
      logoUrl: input.logoUrl,
      industry: input.industry,
      size: input.size ? CompanySize.fromString(input.size) : null,
      location: input.location,
    });

    const eventId = await this.persistAtomically(company);
    this.publishInternalEvents(company);
    await this.outboxService.schedulePublishing([eventId]);

    this.logger.info('Company updated successfully', {
      companyId: input.companyId,
    });
  }

  /**
   * Load the company and verify the caller is the creator.
   */
  private async loadAndAuthorize(input: UpdateCompanyInput): Promise<Company> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundException(input.companyId);
    }

    if (company.createdBy !== input.userId) {
      throw new CompanyAccessDeniedException(
        'Only company creator can update company information',
      );
    }

    return company;
  }

  private async persistAtomically(company: Company): Promise<string> {
    return this.unitOfWork.execute(async (tx) => {
      await this.companyRepository.save(company, tx);
      return this.outboxService.saveEvent(
        COMPANY_EVENT_TYPES.UPDATED,
        {
          companyId: company.id,
          name: company.name,
          updatedAt: new Date().toISOString(),
        },
        company.id,
        tx,
      );
    });
  }

  private publishInternalEvents(company: Company): void {
    company.getUncommittedEvents().forEach((event) => {
      this.eventBus.publish(event);
    });
    company.clearEvents();
  }
}
