import type {
  UserReadModel,
  UserWithProfileReadModel,
  UserSummaryReadModel,
} from '../read-models/user.read-model';

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
 * User list filters
 */
export interface UserListFilters {
  search?: string;
  status?: string;
  role?: string;
}

/**
 * User Read Repository Interface (Query operations)
 * Returns Read Models (plain objects) - no domain entities
 * Optimized for read operations (CQRS read side)
 */
export interface IUserReadRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<UserReadModel | null>;

  /**
   * Find user by ID with profile info (candidate or HR)
   */
  findByIdWithProfile(id: string): Promise<UserWithProfileReadModel | null>;

  /**
   * Find user by external auth provider ID
   */
  findByExternalAuthId(externalAuthId: string): Promise<UserReadModel | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<UserReadModel | null>;

  /**
   * List users with pagination and filters
   */
  list(
    page: number,
    limit: number,
    filters?: UserListFilters,
  ): Promise<PaginatedResult<UserReadModel>>;

  /**
   * Get user summary (for dropdowns, references)
   */
  getSummary(id: string): Promise<UserSummaryReadModel | null>;

  /**
   * Count users
   */
  count(filters?: UserListFilters): Promise<number>;

  /**
   * Count users by status
   */
  countByStatus(): Promise<Record<string, number>>;
}
