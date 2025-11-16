import type {
  CompanyReadModel,
  CompanyWithUsersReadModel,
  CompanyDetailReadModel,
} from '../read-models/company.read-model';

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Company list filters
 */
export interface CompanyListFilters {
  search?: string; // Search in name, industry, location
  isActive?: boolean;
  createdBy?: string;
}

/**
 * Company Read Repository Interface (Query operations)
 * Returns Read Models (plain objects) - no domain entities
 * Optimized for read operations (CQRS read side)
 */
export interface ICompanyReadRepository {
  /**
   * Find company by ID
   */
  findById(id: string): Promise<CompanyReadModel | null>;

  /**
   * Find company by ID with users count
   */
  findByIdWithUsers(id: string): Promise<CompanyWithUsersReadModel | null>;

  /**
   * Find company by ID with full details (users count + creator info)
   */
  findByIdWithDetails(id: string): Promise<CompanyDetailReadModel | null>;

  /**
   * List companies with pagination and filters
   */
  list(
    page: number,
    limit: number,
    filters?: CompanyListFilters,
  ): Promise<PaginatedResult<CompanyReadModel>>;

  /**
   * List companies for specific user (from user_companies)
   */
  listByUserId(userId: string): Promise<CompanyReadModel[]>;

  /**
   * Count companies
   */
  count(filters?: CompanyListFilters): Promise<number>;

  /**
   * Check if user has access to company
   */
  hasUserAccess(companyId: string, userId: string): Promise<boolean>;
}
