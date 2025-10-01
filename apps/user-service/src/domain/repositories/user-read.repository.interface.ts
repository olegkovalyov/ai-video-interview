import { User } from '../aggregates/user.aggregate';

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
 * Optimized for read operations (CQRS read side)
 * Can use different data models or even different databases
 */
export interface IUserReadRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by Keycloak ID
   */
  findByKeycloakId(keycloakId: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * List users with pagination and filters
   */
  list(
    page: number,
    limit: number,
    filters?: UserListFilters,
  ): Promise<PaginatedResult<User>>;

  /**
   * Count users
   */
  count(filters?: UserListFilters): Promise<number>;

  /**
   * Count users by status
   */
  countByStatus(): Promise<Record<string, number>>;
}
