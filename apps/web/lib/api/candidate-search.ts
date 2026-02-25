/**
 * Candidate Search API Client (for HR)
 * Методы для поиска кандидатов по скиллам
 * 
 * ✅ Подключено к реальным API эндпоинтам
 */

import { apiGet } from '@/lib/api';

// ========================================
// TYPES
// ========================================

export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead';
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface CandidateSkillMatch {
  skillId: string;
  skillName: string;
  proficiencyLevel: ProficiencyLevel;
  yearsOfExperience: number;
}

export interface CandidateSearchResult {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  experienceLevel: ExperienceLevel | null;
  matchedSkills: CandidateSkillMatch[];
  matchScore: number; // 0-100, процент совпадения
}

export interface CandidateSearchFilters {
  skillIds?: string[];
  minProficiency?: ProficiencyLevel;
  minYears?: number;
  experienceLevel?: ExperienceLevel;
  page?: number;
  limit?: number;
}

export interface CandidateSearchResponse {
  data: CandidateSearchResult[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ========================================
// HR API - Candidate Search
// ========================================

/**
 * Search candidates by skills (HR)
 * GET /api/hr/candidates/search
 */
export async function searchCandidates(filters: CandidateSearchFilters = {}): Promise<CandidateSearchResponse> {
  const params = new URLSearchParams();
  
  if (filters.skillIds && filters.skillIds.length > 0) {
    filters.skillIds.forEach(id => params.append('skillIds', id));
  }
  if (filters.minProficiency) params.append('minProficiency', filters.minProficiency);
  if (filters.minYears) params.append('minYears', String(filters.minYears));
  if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  
  return apiGet<CandidateSearchResponse>(`/api/hr/candidates/search?${params}`);
}

/**
 * Get experience level display info
 */
export function getExperienceLevelDisplay(level: ExperienceLevel | null | undefined): { label: string; color: string } {
  const map = {
    junior: { label: 'Junior', color: 'text-blue-400' },
    mid: { label: 'Mid-level', color: 'text-cyan-400' },
    senior: { label: 'Senior', color: 'text-emerald-400' },
    lead: { label: 'Lead', color: 'text-yellow-400' },
  };
  
  if (!level || !map[level]) {
    return { label: 'Not specified', color: 'text-gray-400' };
  }
  
  return map[level];
}
