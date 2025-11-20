/**
 * Candidate Search API Client (for HR)
 * Методы для поиска кандидатов по скиллам
 * 
 * TODO: Переключить на реальные API когда будут готовы эндпоинты в API Gateway
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
  experienceLevel: ExperienceLevel;
  skills: CandidateSkillMatch[];
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
// MOCK DATA (TODO: Remove when API ready)
// ========================================

const MOCK_CANDIDATES: CandidateSearchResult[] = [
  {
    userId: 'user-1',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    experienceLevel: 'senior',
    matchScore: 95,
    skills: [
      { skillId: 'skill-1', skillName: 'React', proficiencyLevel: 'expert', yearsOfExperience: 5 },
      { skillId: 'skill-2', skillName: 'TypeScript', proficiencyLevel: 'advanced', yearsOfExperience: 4 },
      { skillId: 'skill-7', skillName: 'Node.js', proficiencyLevel: 'advanced', yearsOfExperience: 4 },
      { skillId: 'skill-12', skillName: 'Docker', proficiencyLevel: 'advanced', yearsOfExperience: 3 },
    ],
  },
  {
    userId: 'user-2',
    fullName: 'Jane Smith',
    email: 'jane.smith@example.com',
    experienceLevel: 'senior',
    matchScore: 90,
    skills: [
      { skillId: 'skill-1', skillName: 'React', proficiencyLevel: 'expert', yearsOfExperience: 6 },
      { skillId: 'skill-5', skillName: 'Next.js', proficiencyLevel: 'advanced', yearsOfExperience: 3 },
      { skillId: 'skill-6', skillName: 'Tailwind CSS', proficiencyLevel: 'expert', yearsOfExperience: 3 },
      { skillId: 'skill-20', skillName: 'PostgreSQL', proficiencyLevel: 'advanced', yearsOfExperience: 4 },
    ],
  },
  {
    userId: 'user-3',
    fullName: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    experienceLevel: 'mid',
    matchScore: 80,
    skills: [
      { skillId: 'skill-2', skillName: 'TypeScript', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
      { skillId: 'skill-7', skillName: 'Node.js', proficiencyLevel: 'advanced', yearsOfExperience: 3 },
      { skillId: 'skill-11', skillName: 'NestJS', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
      { skillId: 'skill-20', skillName: 'PostgreSQL', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
    ],
  },
  {
    userId: 'user-4',
    fullName: 'Sarah Williams',
    email: 'sarah.williams@example.com',
    experienceLevel: 'lead',
    matchScore: 98,
    skills: [
      { skillId: 'skill-1', skillName: 'React', proficiencyLevel: 'expert', yearsOfExperience: 8 },
      { skillId: 'skill-2', skillName: 'TypeScript', proficiencyLevel: 'expert', yearsOfExperience: 7 },
      { skillId: 'skill-5', skillName: 'Next.js', proficiencyLevel: 'expert', yearsOfExperience: 5 },
      { skillId: 'skill-7', skillName: 'Node.js', proficiencyLevel: 'expert', yearsOfExperience: 7 },
      { skillId: 'skill-14', skillName: 'AWS', proficiencyLevel: 'advanced', yearsOfExperience: 5 },
    ],
  },
  {
    userId: 'user-5',
    fullName: 'David Brown',
    email: 'david.brown@example.com',
    experienceLevel: 'junior',
    matchScore: 65,
    skills: [
      { skillId: 'skill-1', skillName: 'React', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
      { skillId: 'skill-2', skillName: 'TypeScript', proficiencyLevel: 'beginner', yearsOfExperience: 1 },
      { skillId: 'skill-6', skillName: 'Tailwind CSS', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    ],
  },
  {
    userId: 'user-6',
    fullName: 'Emily Davis',
    email: 'emily.davis@example.com',
    experienceLevel: 'mid',
    matchScore: 85,
    skills: [
      { skillId: 'skill-3', skillName: 'Vue.js', proficiencyLevel: 'advanced', yearsOfExperience: 3 },
      { skillId: 'skill-2', skillName: 'TypeScript', proficiencyLevel: 'advanced', yearsOfExperience: 3 },
      { skillId: 'skill-7', skillName: 'Node.js', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
      { skillId: 'skill-21', skillName: 'MongoDB', proficiencyLevel: 'advanced', yearsOfExperience: 3 },
    ],
  },
  {
    userId: 'user-7',
    fullName: 'Chris Martinez',
    email: 'chris.martinez@example.com',
    experienceLevel: 'senior',
    matchScore: 92,
    skills: [
      { skillId: 'skill-8', skillName: 'Python', proficiencyLevel: 'expert', yearsOfExperience: 6 },
      { skillId: 'skill-10', skillName: 'Java', proficiencyLevel: 'advanced', yearsOfExperience: 5 },
      { skillId: 'skill-12', skillName: 'Docker', proficiencyLevel: 'expert', yearsOfExperience: 4 },
      { skillId: 'skill-13', skillName: 'Kubernetes', proficiencyLevel: 'advanced', yearsOfExperience: 3 },
      { skillId: 'skill-14', skillName: 'AWS', proficiencyLevel: 'expert', yearsOfExperience: 5 },
    ],
  },
  {
    userId: 'user-8',
    fullName: 'Lisa Anderson',
    email: 'lisa.anderson@example.com',
    experienceLevel: 'mid',
    matchScore: 78,
    skills: [
      { skillId: 'skill-17', skillName: 'React Native', proficiencyLevel: 'advanced', yearsOfExperience: 3 },
      { skillId: 'skill-1', skillName: 'React', proficiencyLevel: 'advanced', yearsOfExperience: 4 },
      { skillId: 'skill-2', skillName: 'TypeScript', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
    ],
  },
];

// ========================================
// HR API - Candidate Search
// ========================================

/**
 * Search candidates by skills (HR)
 * TODO: Replace with: GET /api/hr/candidates/search
 */
export async function searchCandidates(filters: CandidateSearchFilters = {}): Promise<CandidateSearchResponse> {
  // MOCK IMPLEMENTATION
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network delay
  
  let filtered = [...MOCK_CANDIDATES];
  
  // Filter by skills
  if (filters.skillIds && filters.skillIds.length > 0) {
    filtered = filtered.filter(candidate => {
      const candidateSkillIds = candidate.skills.map(s => s.skillId);
      return filters.skillIds!.some(skillId => candidateSkillIds.includes(skillId));
    });
  }
  
  // Filter by min proficiency
  if (filters.minProficiency) {
    const proficiencyOrder: ProficiencyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const minIndex = proficiencyOrder.indexOf(filters.minProficiency);
    
    filtered = filtered.filter(candidate => {
      return candidate.skills.some(skill => {
        const skillIndex = proficiencyOrder.indexOf(skill.proficiencyLevel);
        return skillIndex >= minIndex;
      });
    });
  }
  
  // Filter by min years
  if (filters.minYears) {
    filtered = filtered.filter(candidate => {
      return candidate.skills.some(skill => skill.yearsOfExperience >= filters.minYears!);
    });
  }
  
  // Filter by experience level
  if (filters.experienceLevel) {
    filtered = filtered.filter(c => c.experienceLevel === filters.experienceLevel);
  }
  
  // Sort by match score (descending)
  filtered.sort((a, b) => b.matchScore - a.matchScore);
  
  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginated = filtered.slice(start, end);
  
  return {
    data: paginated,
    pagination: {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    },
  };
  
  // REAL API (uncomment when ready):
  // const params = new URLSearchParams();
  // if (filters.skillIds) filters.skillIds.forEach(id => params.append('skillIds[]', id));
  // if (filters.minProficiency) params.append('minProficiency', filters.minProficiency);
  // if (filters.minYears) params.append('minYears', String(filters.minYears));
  // if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel);
  // if (filters.page) params.append('page', String(filters.page));
  // if (filters.limit) params.append('limit', String(filters.limit));
  // return apiGet<CandidateSearchResponse>(`/api/hr/candidates/search?${params}`);
}

/**
 * Get experience level display info
 */
export function getExperienceLevelDisplay(level: ExperienceLevel): { label: string; color: string } {
  const map = {
    junior: { label: 'Junior', color: 'text-green-400' },
    mid: { label: 'Mid-level', color: 'text-blue-400' },
    senior: { label: 'Senior', color: 'text-purple-400' },
    lead: { label: 'Lead', color: 'text-yellow-400' },
  };
  return map[level];
}
