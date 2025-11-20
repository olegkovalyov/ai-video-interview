import { CandidateProfile } from '../aggregates/candidate-profile.aggregate';

/**
 * CandidateProfile Repository Interface (Write operations)
 * Defines contract for candidate profile persistence
 */
export interface ICandidateProfileRepository {
  /**
   * Save candidate profile (create or update with skills CASCADE)
   */
  save(profile: CandidateProfile): Promise<void>;

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
