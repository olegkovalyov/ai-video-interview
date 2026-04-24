import { Query } from '@nestjs/cqrs';
import type { CompanyReadModel } from '../../../domain/read-models/company.read-model';

export class GetCompanyQuery extends Query<CompanyReadModel> {
  constructor(
    public readonly companyId: string,
    public readonly currentUserId?: string,
    public readonly isAdmin?: boolean,
  ) {
    super();
  }
}
