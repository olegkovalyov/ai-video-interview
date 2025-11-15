/**
 * Candidate Skills API Client
 * Методы для управления своими скиллами (Candidate)
 * 
 * TODO: Переключить на реальные API когда будут готовы эндпоинты в API Gateway
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
// MOCK DATA (TODO: Remove when API ready)
// ========================================

const MOCK_CANDIDATE_SKILLS: CandidateSkill[] = [
  // Frontend
  { skillId: 'skill-1', skillName: 'React', categoryName: 'Frontend', description: 'Built 10+ production React apps', proficiencyLevel: 'expert', yearsOfExperience: 5, addedAt: '2024-01-15T10:00:00Z' },
  { skillId: 'skill-2', skillName: 'TypeScript', categoryName: 'Frontend', description: 'Used in all recent projects', proficiencyLevel: 'advanced', yearsOfExperience: 4, addedAt: '2024-01-15T10:00:00Z' },
  { skillId: 'skill-5', skillName: 'Next.js', categoryName: 'Frontend', description: 'SSR and ISR experience', proficiencyLevel: 'advanced', yearsOfExperience: 3, addedAt: '2024-01-16T10:00:00Z' },
  { skillId: 'skill-6', skillName: 'Tailwind CSS', categoryName: 'Frontend', proficiencyLevel: 'expert', yearsOfExperience: 3, addedAt: '2024-01-16T10:00:00Z' },
  
  // Backend
  { skillId: 'skill-7', skillName: 'Node.js', categoryName: 'Backend', description: 'Microservices architecture', proficiencyLevel: 'advanced', yearsOfExperience: 4, addedAt: '2024-01-17T10:00:00Z' },
  { skillId: 'skill-11', skillName: 'NestJS', categoryName: 'Backend', description: 'Built scalable APIs', proficiencyLevel: 'intermediate', yearsOfExperience: 2, addedAt: '2024-01-17T10:00:00Z' },
  
  // DevOps
  { skillId: 'skill-12', skillName: 'Docker', categoryName: 'DevOps', proficiencyLevel: 'advanced', yearsOfExperience: 3, addedAt: '2024-01-18T10:00:00Z' },
  { skillId: 'skill-14', skillName: 'AWS', categoryName: 'DevOps', description: 'EC2, S3, Lambda, RDS', proficiencyLevel: 'intermediate', yearsOfExperience: 2, addedAt: '2024-01-18T10:00:00Z' },
  
  // Database
  { skillId: 'skill-20', skillName: 'PostgreSQL', categoryName: 'Database', proficiencyLevel: 'advanced', yearsOfExperience: 4, addedAt: '2024-01-19T10:00:00Z' },
  { skillId: 'skill-22', skillName: 'Redis', categoryName: 'Database', description: 'Caching and session store', proficiencyLevel: 'intermediate', yearsOfExperience: 2, addedAt: '2024-01-19T10:00:00Z' },
];

let mockCandidateSkillsData = [...MOCK_CANDIDATE_SKILLS];

// ========================================
// CANDIDATE API - My Skills Management
// ========================================

/**
 * Get my skills grouped by category (Candidate)
 * TODO: Replace with: GET /api/me/skills
 */
export async function getMyCandidateSkills(): Promise<CandidateSkillsByCategory[]> {
  // MOCK IMPLEMENTATION
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Group by category
  const grouped = mockCandidateSkillsData.reduce((acc, skill) => {
    const existing = acc.find(g => g.categoryName === skill.categoryName);
    if (existing) {
      existing.skills.push(skill);
    } else {
      acc.push({
        categoryId: `cat-${skill.categoryName}`,
        categoryName: skill.categoryName,
        skills: [skill],
      });
    }
    return acc;
  }, [] as CandidateSkillsByCategory[]);
  
  return grouped;
  
  // REAL API (uncomment when ready):
  // return apiGet<CandidateSkillsByCategory[]>('/api/me/skills');
}

/**
 * Add skill to my profile (Candidate)
 * TODO: Replace with: POST /api/me/skills
 */
export async function addMyCandidateSkill(dto: AddCandidateSkillDto): Promise<CandidateSkill> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Check if already added
  const existing = mockCandidateSkillsData.find(s => s.skillId === dto.skillId);
  if (existing) {
    throw new Error('Skill already added');
  }
  
  // Find skill info (normally from backend)
  const skillInfo = {
    skillName: 'New Skill',
    categoryName: 'Uncategorized',
  };
  
  const newSkill: CandidateSkill = {
    skillId: dto.skillId,
    skillName: skillInfo.skillName,
    categoryName: skillInfo.categoryName,
    description: dto.description,
    proficiencyLevel: dto.proficiencyLevel || 'beginner',
    yearsOfExperience: dto.yearsOfExperience || 0,
    addedAt: new Date().toISOString(),
  };
  
  mockCandidateSkillsData.push(newSkill);
  return newSkill;
  
  // REAL API:
  // return apiPost<CandidateSkill>('/api/me/skills', dto);
}

/**
 * Update my skill (Candidate)
 * TODO: Replace with: PUT /api/me/skills/:skillId
 */
export async function updateMyCandidateSkill(
  skillId: string,
  dto: UpdateCandidateSkillDto
): Promise<CandidateSkill> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 350));
  
  const index = mockCandidateSkillsData.findIndex(s => s.skillId === skillId);
  if (index === -1) throw new Error('Skill not found');
  
  mockCandidateSkillsData[index] = {
    ...mockCandidateSkillsData[index],
    description: dto.description !== undefined ? dto.description : mockCandidateSkillsData[index].description,
    proficiencyLevel: dto.proficiencyLevel || mockCandidateSkillsData[index].proficiencyLevel,
    yearsOfExperience: dto.yearsOfExperience !== undefined ? dto.yearsOfExperience : mockCandidateSkillsData[index].yearsOfExperience,
  };
  
  return mockCandidateSkillsData[index];
  
  // REAL API:
  // return apiPut<CandidateSkill>(`/api/me/skills/${skillId}`, dto);
}

/**
 * Remove skill from my profile (Candidate)
 * TODO: Replace with: DELETE /api/me/skills/:skillId
 */
export async function removeMyCandidateSkill(skillId: string): Promise<{ success: boolean; message: string }> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const index = mockCandidateSkillsData.findIndex(s => s.skillId === skillId);
  if (index === -1) throw new Error('Skill not found');
  
  mockCandidateSkillsData.splice(index, 1);
  
  return { success: true, message: 'Skill removed successfully' };
  
  // REAL API:
  // return apiDelete<{ success: boolean; message: string }>(`/api/me/skills/${skillId}`);
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
