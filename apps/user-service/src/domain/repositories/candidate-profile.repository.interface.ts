import { CandidateProfile } from '../aggregates/candidate-profile.aggregate';
import type { ITransactionContext } from '../../application/interfaces/transaction-context.interface';

/**
 * CandidateProfile Repository Interface (Write operations)
 * Defines contract for candidate profile persistence
 */
export interface ICandidateProfileRepository {
  /**
   * Save candidate profile (create or update with skills CASCADE)
   * @param tx - optional transaction context from UnitOfWork
   */
  save(profile: CandidateProfile, tx?: ITransactionContext): Promise<void>;

  /**
   * Find candidate profile by user ID (with skills loaded)
   */
  findByUserId(userId: string): Promise<CandidateProfile | null>;

  /**
   * Delete candidate profile (CASCADE removes candidate_skills)
   */
  delete(userId: string): Promise<void>;

  /**
   * Check if candidate has specific skill
   */
  hasSkill(userId: string, skillId: string): Promise<boolean>;
}
