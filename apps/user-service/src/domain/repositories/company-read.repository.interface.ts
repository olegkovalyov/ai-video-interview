import { Company } from '../aggregates/company.aggregate';

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
 * Company with user info
 */
export interface CompanyWithUsers extends Company {
  usersCount: number;
}

/**
 * Company Read Repository Interface (Query operations)
 * Optimized for read operations (CQRS read side)
 */
export interface ICompanyReadRepository {
  /**
   * Find company by ID
   */
  findById(id: string): Promise<Company | null>;

  /**
   * Find company by ID with users count
   */
  findByIdWithUsers(id: string): Promise<CompanyWithUsers | null>;

  /**
   * List companies with pagination and filters
   */
  list(
    page: number,
    limit: number,
    filters?: CompanyListFilters,
  ): Promise<PaginatedResult<Company>>;

  /**
   * List companies for specific user (from user_companies)
   */
  listByUserId(userId: string): Promise<Company[]>;

  /**
   * Count companies
   */
  count(filters?: CompanyListFilters): Promise<number>;

  /**
   * Check if user has access to company
   */
  hasUserAccess(companyId: string, userId: string): Promise<boolean>;
}
