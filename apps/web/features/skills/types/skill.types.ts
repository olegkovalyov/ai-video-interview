/**
 * Skills Feature Types
 */

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Skill {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  description?: string;
  isActive: boolean;
  candidatesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  skillsCount: number;
}

export interface SkillStats {
  total: number;
  active: number;
  inactive: number;
  totalCategories: number;
  totalCandidatesUsingSkills: number;
}

export interface SkillFilters {
  search: string;
  categoryId: string;
  status: 'all' | 'active' | 'inactive';
}
