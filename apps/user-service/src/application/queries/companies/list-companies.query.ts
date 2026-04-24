import { Query } from '@nestjs/cqrs';
import type { PaginatedResult } from '../../../domain/repositories/company-read.repository.interface';
import type { CompanyReadModel } from '../../../domain/read-models/company.read-model';

export class ListCompaniesQuery extends Query<
  PaginatedResult<CompanyReadModel>
> {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 50,
    public readonly isActive?: boolean,
    public readonly search?: string,
    public readonly createdBy?: string,
    public readonly currentUserId?: string,
    public readonly isAdmin?: boolean,
  ) {
    super();
  }
}
