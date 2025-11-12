import { CandidateProfile } from '../aggregates/candidate-profile.aggregate';
import { CandidateSkill } from '../entities/candidate-skill.entity';

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
 * Candidate search filters
 */
export interface CandidateSearchFilters {
  skillIds?: string[]; // Must have ALL these skills
  minProficiency?: string; // Minimum proficiency level
  minYears?: number; // Minimum years of experience per skill
  experienceLevel?: string; // Overall experience level (junior/mid/senior/lead)
}

/**
 * Candidate search result with match score
 */
export interface CandidateSearchResult {
  userId: string;
  fullName: string;
  email: string;
  experienceLevel: string | null;
  matchedSkills: CandidateSkill[];
  matchScore: number; // Calculated based on proficiency + years
}

/**
 * Candidate profile with user info
 */
export interface CandidateProfileWithUser {
  profile: CandidateProfile;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

/**
 * CandidateProfile Read Repository Interface (Query operations)
 * Optimized for read operations (CQRS read side)
 */
export interface ICandidateProfileReadRepository {
  /**
   * Find candidate profile by user ID (with skills)
   */
  findByUserId(userId: string): Promise<CandidateProfile | null>;

  /**
   * Find candidate profile with user info
   */
  findByUserIdWithUser(userId: string): Promise<CandidateProfileWithUser | null>;

  /**
   * Search candidates by skills with filters
   */
  searchBySkills(
    filters: CandidateSearchFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<CandidateSearchResult>>;

  /**
   * Get candidate skills grouped by category
   */
  getCandidateSkillsGroupedByCategory(userId: string): Promise<{
    categoryId: string | null;
    categoryName: string | null;
    skills: CandidateSkill[];
  }[]>;

  /**
   * Count candidates with specific skill
   */
  countBySkill(skillId: string): Promise<number>;

  /**
   * List top skills (most used by candidates)
   */
  getTopSkills(limit: number): Promise<{
    skillId: string;
    skillName: string;
    count: number;
  }[]>;
}
