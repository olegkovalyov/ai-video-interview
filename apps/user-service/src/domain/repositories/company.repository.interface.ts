import { Company } from '../aggregates/company.aggregate';
import type { ITransactionContext } from '../../application/interfaces/transaction-context.interface';

/**
 * Company Repository Interface (Write operations)
 * Defines contract for persisting Company aggregates
 */
export interface ICompanyRepository {
  /**
   * Save company (create or update)
   * @param tx - optional transaction context from UnitOfWork
   */
  save(company: Company, tx?: ITransactionContext): Promise<void>;

  /**
   * Find company by ID
   */
  findById(id: string): Promise<Company | null>;

  /**
   * Delete company (hard delete with CASCADE to user_companies)
   * @param tx - optional transaction context from UnitOfWork
   */
  delete(id: string, tx?: ITransactionContext): Promise<void>;

  /**
   * Check if user is associated with company
   */
  isUserInCompany(companyId: string, userId: string): Promise<boolean>;
}
