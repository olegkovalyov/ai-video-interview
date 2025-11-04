import { HRProfile } from '../aggregates/hr-profile.aggregate';

/**
 * HRProfile Repository Interface
 * Defines contract for HR profile persistence
 */
export interface IHRProfileRepository {
  /**
   * Save HR profile (create or update)
   */
  save(profile: HRProfile): Promise<HRProfile>;

  /**
   * Find HR profile by user ID
   */
  findByUserId(userId: string): Promise<HRProfile | null>;

  /**
   * Delete HR profile
   */
  delete(userId: string): Promise<void>;
}
