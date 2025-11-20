/**
 * Skills Feature Types
 */

// Re-export shared types from API client
export type { Skill, SkillCategory } from '@/lib/api/skills';

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SkillStats {
  total: number;
  active: number;
  inactive: number;
  totalCategories: number;
}

export interface SkillFilters {
  search: string;
  categoryId: string;
  status: 'all' | 'active' | 'inactive';
}
