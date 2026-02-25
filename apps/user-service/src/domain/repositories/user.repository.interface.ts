import { User } from '../aggregates/user.aggregate';
import type { ITransactionContext } from '../../application/interfaces/transaction-context.interface';

/**
 * User Repository Interface (Write operations)
 * Defines contract for persisting User aggregates
 * Implementation will be in infrastructure layer
 */
export interface IUserRepository {
  /**
   * Save user (create or update)
   * @param tx - optional transaction context from UnitOfWork
   */
  save(user: User, tx?: ITransactionContext): Promise<void>;

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
   * @param tx - optional transaction context from UnitOfWork
   */
  delete(id: string, tx?: ITransactionContext): Promise<void>;
}
