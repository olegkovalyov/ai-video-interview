/**
 * Candidate Skills API Client
 * Методы для управления своими скиллами (Candidate)
 * 
 * ✅ Подключено к реальным API эндпоинтам
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

// ========================================
// TYPES
// ========================================

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

export interface AddCandidateSkillDto {
  skillId: string;
  description?: string;
  proficiencyLevel?: ProficiencyLevel;
  yearsOfExperience?: number;
}

export interface UpdateCandidateSkillDto {
  description?: string;
  proficiencyLevel?: ProficiencyLevel;
  yearsOfExperience?: number;
}


// ========================================
// CANDIDATE API - My Skills Management
// ========================================

/**
 * Get my skills grouped by category (Candidate)
 * GET /api/me/skills
 */
export async function getMyCandidateSkills(): Promise<CandidateSkillsByCategory[]> {
  return apiGet<CandidateSkillsByCategory[]>('/api/me/skills');
}

/**
 * Add skill to my profile (Candidate)
 * POST /api/me/skills
 */
export async function addMyCandidateSkill(dto: AddCandidateSkillDto): Promise<CandidateSkill> {
  return apiPost<CandidateSkill>('/api/me/skills', dto);
}

/**
 * Update my skill (Candidate)
 * PUT /api/me/skills/:skillId
 */
export async function updateMyCandidateSkill(
  skillId: string,
  dto: UpdateCandidateSkillDto
): Promise<CandidateSkill> {
  return apiPut<CandidateSkill>(`/api/me/skills/${skillId}`, dto);
}

/**
 * Remove skill from my profile (Candidate)
 * DELETE /api/me/skills/:skillId
 */
export async function removeMyCandidateSkill(skillId: string): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(`/api/me/skills/${skillId}`);
}

/**
 * Helper: Get proficiency level display
 */
export function getProficiencyDisplay(level: ProficiencyLevel): { label: string; stars: number; color: string } {
  const map = {
    beginner: { label: 'Beginner', stars: 1, color: 'text-yellow-400' },
    intermediate: { label: 'Intermediate', stars: 2, color: 'text-blue-400' },
    advanced: { label: 'Advanced', stars: 3, color: 'text-purple-400' },
    expert: { label: 'Expert', stars: 4, color: 'text-green-400' },
  };
  return map[level];
}
