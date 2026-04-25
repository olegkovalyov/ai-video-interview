import type {
  CandidateProfileReadModel,
  CandidateProfileWithUserReadModel,
  SkillsByCategoryReadModel,
  CandidateSearchResultReadModel,
} from '../read-models/candidate-profile.read-model';

// Type aliases for backward compatibility
export type CandidateProfileWithUser = CandidateProfileWithUserReadModel;
export type SkillsByCategory = SkillsByCategoryReadModel;
export type CandidateSearchResult = CandidateSearchResultReadModel;

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
 * CandidateProfile Query Service Interface (CQRS read side).
 *
 * Returns Read Models (plain objects) — no domain entities. Not a DDD
 * Repository (write-side aggregate gateway): legitimately composes multiple
 * tables and entity repos to produce denormalized projections for the UI.
 *
 * Naming: kept under `domain/repositories/` for now; physical move can come
 * later — the rename signals intent without churning DI registration paths.
 */
export interface ICandidateProfileQueryService {
  /**
   * Find candidate profile by user ID
   */
  findByUserId(userId: string): Promise<CandidateProfileReadModel | null>;

  /**
   * Find candidate profile with user info
   */
  findByUserIdWithUser(
    userId: string,
  ): Promise<CandidateProfileWithUserReadModel | null>;

  /**
   * Search candidates by skills with filters
   */
  searchBySkills(
    filters: CandidateSearchFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<CandidateSearchResultReadModel>>;

  /**
   * Get candidate skills grouped by category
   */
  getCandidateSkillsGroupedByCategory(
    userId: string,
  ): Promise<SkillsByCategoryReadModel[]>;

  /**
   * Count candidates with specific skill
   */
  countBySkill(skillId: string): Promise<number>;

  /**
   * List top skills (most used by candidates)
   */
  getTopSkills(limit: number): Promise<
    {
      skillId: string;
      skillName: string;
      count: number;
    }[]
  >;
}
