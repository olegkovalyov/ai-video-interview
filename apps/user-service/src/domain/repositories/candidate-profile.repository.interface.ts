import { CandidateProfile } from '../aggregates/candidate-profile.aggregate';

/**
 * CandidateProfile Repository Interface
 * Defines contract for candidate profile persistence
 */
export interface ICandidateProfileRepository {
  /**
   * Save candidate profile (create or update)
   */
  save(profile: CandidateProfile): Promise<CandidateProfile>;

  /**
   * Find candidate profile by user ID
   */
  findByUserId(userId: string): Promise<CandidateProfile | null>;

  /**
   * Delete candidate profile
   */
  delete(userId: string): Promise<void>;

  /**
   * Find all complete profiles (for HR search)
   */
  findCompleteProfiles(limit?: number, offset?: number): Promise<CandidateProfile[]>;

  /**
   * Search candidates by skills
   */
  searchBySkills(skills: string[], limit?: number): Promise<CandidateProfile[]>;
}
