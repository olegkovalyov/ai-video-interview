/**
 * Skill Read Model
 * Plain object for query responses (CQRS read side)
 * No business logic, just data
 */
export interface SkillReadModel {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Skill Category Read Model
 */
export interface SkillCategoryReadModel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Skill with Category Read Model
 * Used for list/detail views that need category info
 */
export interface SkillWithCategoryReadModel {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  categoryName: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: SkillCategoryReadModel | null;
}

/**
 * Candidate Skill Read Model
 */
export interface CandidateSkillReadModel {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  categoryName: string | null;
  proficiencyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  yearsOfExperience: number | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
