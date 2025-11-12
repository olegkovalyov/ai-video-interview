import { Company } from '../aggregates/company.aggregate';

/**
 * Company Repository Interface (Write operations)
 * Defines contract for persisting Company aggregates
 */
export interface ICompanyRepository {
  /**
   * Save company (create or update)
   */
  save(company: Company): Promise<void>;

  /**
   * Find company by ID
   */
  findById(id: string): Promise<Company | null>;

  /**
   * Delete company (hard delete with CASCADE to user_companies)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if user is associated with company
   */
  isUserInCompany(companyId: string, userId: string): Promise<boolean>;
}
