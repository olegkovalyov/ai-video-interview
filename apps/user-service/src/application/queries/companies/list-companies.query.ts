import { Query } from '@nestjs/cqrs';
import type { PaginatedResult } from '../../../domain/repositories/company-read.repository.interface';
import type { CompanyReadModel } from '../../../domain/read-models/company.read-model';

export interface ListCompaniesQueryProps {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
  createdBy?: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

export class ListCompaniesQuery extends Query<
  PaginatedResult<CompanyReadModel>
> {
  public readonly page: number;
  public readonly limit: number;
  public readonly isActive?: boolean;
  public readonly search?: string;
  public readonly createdBy?: string;
  public readonly currentUserId?: string;
  public readonly isAdmin?: boolean;

  constructor(props: ListCompaniesQueryProps = {}) {
    super();
    this.page = props.page ?? 1;
    this.limit = props.limit ?? 50;
    this.isActive = props.isActive;
    this.search = props.search;
    this.createdBy = props.createdBy;
    this.currentUserId = props.currentUserId;
    this.isAdmin = props.isAdmin;
  }
}
