import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetCompanyQuery } from './get-company.query';
import type { ICompanyReadRepository } from '../../../domain/repositories/company-read.repository.interface';
import type { CompanyReadModel } from '../../../domain/read-models/company.read-model';

/**
 * Get Company Query Handler
 * Returns Read Model (plain object) - no domain entity
 */
@QueryHandler(GetCompanyQuery)
export class GetCompanyHandler implements IQueryHandler<GetCompanyQuery> {
  constructor(
    @Inject('ICompanyReadRepository')
    private readonly companyReadRepository: ICompanyReadRepository,
  ) {}

  async execute(query: GetCompanyQuery): Promise<CompanyReadModel> {
    const company = await this.companyReadRepository.findById(query.companyId);
    
    if (!company) {
      throw new NotFoundException(`Company with ID "${query.companyId}" not found`);
    }

    // Check access: ADMIN or HR from this company
    if (!query.isAdmin && query.currentUserId) {
      const hasAccess = await this.companyReadRepository.hasUserAccess(
        query.companyId,
        query.currentUserId,
      );
      
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this company');
      }
    }

    return company;
  }
}
