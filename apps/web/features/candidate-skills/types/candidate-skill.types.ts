/**
 * Candidate Skills Feature Types
 */

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface CandidateSkill {
  skillId: string;
  skillName: string;
  categoryName: string;
  description?: string;
  proficiencyLevel: ProficiencyLevel;
  yearsOfExperience: number;
  addedAt: string;
}

export interface CandidateSkillsByCategory {
  categoryId: string;
  categoryName: string;
  skills: CandidateSkill[];
}
