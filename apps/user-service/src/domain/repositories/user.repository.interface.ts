import { User } from '../aggregates/user.aggregate';

/**
 * User Repository Interface (Write operations)
 * Defines contract for persisting User aggregates
 * Implementation will be in infrastructure layer
 */
export interface IUserRepository {
  /**
   * Save user (create or update)
   */
  save(user: User): Promise<void>;

  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by external auth provider ID
   */
  findByExternalAuthId(externalAuthId: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Delete user (hard delete with CASCADE)
   */
  delete(id: string): Promise<void>;
}
