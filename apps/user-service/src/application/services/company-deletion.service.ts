import { Injectable, Inject } from '@nestjs/common';
import type { ICompanyRepository } from '../../domain/repositories/company.repository.interface';
import { Company } from '../../domain/aggregates/company.aggregate';
import {
  CompanyNotFoundException,
  CompanyAccessDeniedException,
} from '../../domain/exceptions/company.exceptions';
import { COMPANY_EVENT_TYPES } from '../../domain/constants';
import type { IOutboxService } from '../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../interfaces/unit-of-work.interface';
import { LoggerService } from '../../infrastructure/logger/logger.service';

export interface DeleteCompanyInput {
  companyId: string;
  userId: string;
}

/**
 * Application service that owns the "hard-delete company" use case.
 *
 * Authorisation: only the company creator may delete. CASCADE on the
 * `user_companies` FK removes association rows in the same transaction.
 * The integration event is persisted before the row goes away so the
 * outbox payload survives the delete (essential for Kafka publication).
 */
@Injectable()
export class CompanyDeletionService {
  constructor(
    @Inject('ICompanyRepository')
    private readonly companyRepository: ICompanyRepository,
    @Inject('IOutboxService')
    private readonly outboxService: IOutboxService,
    @Inject('IUnitOfWork')
    private readonly unitOfWork: IUnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async delete(input: DeleteCompanyInput): Promise<void> {
    this.logger.warn('Hard deleting company (CASCADE)', {
      companyId: input.companyId,
      userId: input.userId,
    });

    const company = await this.loadAndAuthorize(input);
    const eventId = await this.persistAtomically(company, input);
    await this.outboxService.schedulePublishing([eventId]);

    this.logger.warn('Company deleted permanently', {
      companyId: input.companyId,
    });
  }

  private async loadAndAuthorize(input: DeleteCompanyInput): Promise<Company> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) throw new CompanyNotFoundException(input.companyId);
    if (company.createdBy !== input.userId) {
      throw new CompanyAccessDeniedException(
        'Only company creator can delete the company',
      );
    }
    return company;
  }

  private async persistAtomically(
    company: Company,
    input: DeleteCompanyInput,
  ): Promise<string> {
    return this.unitOfWork.execute(async (tx) => {
      // Save the integration event BEFORE the row is gone — the outbox
      // payload survives the delete so the Kafka publisher can still
      // read it after commit.
      const eid = await this.outboxService.saveEvent(
        COMPANY_EVENT_TYPES.DELETED,
        {
          companyId: company.id,
          deletedBy: input.userId,
          deletedAt: new Date().toISOString(),
        },
        company.id,
        tx,
      );
      await this.companyRepository.delete(company.id, tx);
      return eid;
    });
  }
}
