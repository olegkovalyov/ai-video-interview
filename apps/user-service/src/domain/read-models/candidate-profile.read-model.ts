/**
 * Candidate Profile Read Models
 * Plain objects for CQRS Query side
 * No domain logic, no getters - just data structures optimized for reads
 */

/**
 * Basic Candidate Profile Read Model
 * ONLY fields that exist in candidate_profiles table
 */
export interface CandidateProfileReadModel {
  userId: string;
  experienceLevel: string | null; // 'junior', 'mid', 'senior', 'lead'
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Candidate Profile with User Info
 * Denormalized view with user information
 */
export interface CandidateProfileWithUserReadModel extends CandidateProfileReadModel {
  // User info
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  timezone: string;
  language: string;
}

/**
 * Candidate Skill Read Model
 * Skills associated with a candidate
 */
export interface CandidateSkillReadModel {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  skillSlug: string;
  categoryId: string | null;
  categoryName: string | null;
  description: string | null; // Personal description from candidate_skills table
  proficiencyLevel: string | null; // ProficiencyLevel enum value: 'beginner', 'intermediate', 'advanced', 'expert'
  yearsOfExperience: number | null;
  lastUsedAt: Date | null;
  endorsementsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Skills Grouped by Category
 * Used for displaying candidate skills in UI
 */
export interface SkillsByCategoryReadModel {
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  skills: CandidateSkillReadModel[];
}

/**
 * Candidate Search Result
 * Optimized for search and listing
 * Combines data from users + candidate_profiles + skills
 */
export interface CandidateSearchResultReadModel {
  userId: string;
  fullName: string; // from users table
  email: string; // from users table
  avatarUrl: string | null; // from users table
  experienceLevel: string | null; // from candidate_profiles table
  matchScore: number; // calculated score for skill-based search
  skills: {
    skillId: string;
    skillName: string;
    proficiencyLevel: string;
  }[];
}
