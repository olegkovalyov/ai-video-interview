import { Injectable, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { v4 as uuid } from 'uuid';
import { Company } from '../../domain/aggregates/company.aggregate';
import { CompanySize } from '../../domain/value-objects/company-size.vo';
import type { ICompanyRepository } from '../../domain/repositories/company.repository.interface';
import { COMPANY_EVENT_TYPES } from '../../domain/constants';
import { CompanyAlreadyExistsException } from '../../domain/exceptions/company.exceptions';
import type { IOutboxService } from '../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../interfaces/unit-of-work.interface';
import { LoggerService } from '../../infrastructure/logger/logger.service';

/** PostgreSQL unique-violation SQLSTATE — RFC SQL/PG; see pg docs. */
const PG_UNIQUE_VIOLATION = '23505';

export interface CreateCompanyInput {
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  position: string | null;
  createdBy: string;
}

/**
 * Application service that owns the "create new company" use case.
 * Generates IDs (companyId, userCompanyId), parses the size value object,
 * persists the aggregate atomically with the outbox event, publishes
 * internal domain events, and schedules Kafka publishing.
 */
@Injectable()
export class CompanyCreationService {
  // 5 deps reflect the use case scope: repository (persistence), event bus
  // (internal events), outbox + unit-of-work (transactional integration
  // event), logger (observability). See note in UserCreationService.
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

  async create(input: CreateCompanyInput): Promise<{ companyId: string }> {
    this.logger.info('Creating new company', {
      name: input.name,
      createdBy: input.createdBy,
    });

    const companyId = uuid();
    const company = CompanyCreationService.assembleCompany(companyId, input);

    const eventId = await this.persistOrTranslateUniqueViolation(
      company,
      input,
    );
    this.publishInternalEvents(company);
    await this.outboxService.schedulePublishing([eventId]);

    this.logger.info('Company created successfully', {
      companyId,
      name: input.name,
    });
    return { companyId };
  }

  private static assembleCompany(
    companyId: string,
    input: CreateCompanyInput,
  ): Company {
    return Company.create({
      id: companyId,
      name: input.name,
      description: input.description,
      website: input.website,
      logoUrl: input.logoUrl,
      industry: input.industry,
      size: input.size ? CompanySize.fromString(input.size) : null,
      location: input.location,
      createdBy: input.createdBy,
      userCompanyId: uuid(),
      position: input.position,
    });
  }

  /**
   * Persist the aggregate, translating the PG unique-violation SQLSTATE
   * (23505) into a domain-level signal so the HTTP layer can return
   * 409 + COMPANY_ALREADY_EXISTS without leaking driver details.
   */
  private async persistOrTranslateUniqueViolation(
    company: Company,
    input: CreateCompanyInput,
  ): Promise<string> {
    try {
      return await this.persistAtomically(company, input);
    } catch (error) {
      if (CompanyCreationService.isPgUniqueViolation(error)) {
        throw new CompanyAlreadyExistsException(input.name);
      }
      throw error;
    }
  }

  private static isPgUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: unknown }).code === PG_UNIQUE_VIOLATION
    );
  }

  private async persistAtomically(
    company: Company,
    input: CreateCompanyInput,
  ): Promise<string> {
    return this.unitOfWork.execute(async (tx) => {
      await this.companyRepository.save(company, tx);
      return this.outboxService.saveEvent(
        COMPANY_EVENT_TYPES.CREATED,
        {
          companyId: company.id,
          name: input.name,
          createdBy: input.createdBy,
          createdAt: new Date().toISOString(),
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
