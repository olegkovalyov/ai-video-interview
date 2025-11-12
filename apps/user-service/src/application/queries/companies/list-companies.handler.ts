import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListCompaniesQuery } from './list-companies.query';
import type { ICompanyReadRepository, PaginatedResult, CompanyListFilters } from '../../../domain/repositories/company-read.repository.interface';
import { Company } from '../../../domain/aggregates/company.aggregate';

@QueryHandler(ListCompaniesQuery)
export class ListCompaniesHandler implements IQueryHandler<ListCompaniesQuery> {
  constructor(
    @Inject('ICompanyReadRepository')
    private readonly companyReadRepository: ICompanyReadRepository,
  ) {}

  async execute(query: ListCompaniesQuery): Promise<PaginatedResult<Company>> {
    // HR видит только свои компании (из user_companies)
    if (!query.isAdmin && query.currentUserId) {
      const userCompanies = await this.companyReadRepository.listByUserId(query.currentUserId);
      
      // TODO: Apply pagination and filters to user companies
      // For MVP, return all user's companies
      return {
        data: userCompanies,
        total: userCompanies.length,
        page: 1,
        limit: userCompanies.length,
        totalPages: 1,
      };
    }

    // ADMIN видит все компании
    const filters: CompanyListFilters = {
      search: query.search,
      isActive: query.isActive,
      createdBy: query.createdBy,
    };

    return this.companyReadRepository.list(query.page, query.limit, filters);
  }
}
