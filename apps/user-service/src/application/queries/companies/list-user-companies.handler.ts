import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, ForbiddenException } from '@nestjs/common';
import { ListUserCompaniesQuery } from './list-user-companies.query';
import type { ICompanyReadRepository } from '../../../domain/repositories/company-read.repository.interface';
import type { CompanyReadModel } from '../../../domain/read-models/company.read-model';

@QueryHandler(ListUserCompaniesQuery)
export class ListUserCompaniesHandler implements IQueryHandler<ListUserCompaniesQuery> {
  constructor(
    @Inject('ICompanyReadRepository')
    private readonly companyReadRepository: ICompanyReadRepository,
  ) {}

  async execute(query: ListUserCompaniesQuery): Promise<CompanyReadModel[]> {
    // Check permissions: own companies or ADMIN
    const canView = 
      query.userId === query.currentUserId ||
      query.isAdmin;

    if (!canView) {
      throw new ForbiddenException('You do not have permission to view this user\'s companies');
    }

    return this.companyReadRepository.listByUserId(query.userId);
  }
}
