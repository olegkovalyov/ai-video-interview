/**
 * Skills API Client
 * Методы для работы со Skills через API Gateway
 * 
 * TODO: Переключить на реальные API когда будут готовы эндпоинты в API Gateway
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

// ========================================
// TYPES
// ========================================

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

export interface SkillsListResponse {
  data: Skill[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateSkillDto {
  name: string;
  slug: string;
  categoryId?: string;
  description?: string;
}

export interface UpdateSkillDto {
  name?: string;
  description?: string;
  categoryId?: string;
}

export interface SkillFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}

// ========================================
// MOCK DATA (TODO: Remove when API ready)
// ========================================

const MOCK_CATEGORIES: SkillCategory[] = [
  { id: 'cat-1', name: 'Frontend', slug: 'frontend', skillsCount: 12 },
  { id: 'cat-2', name: 'Backend', slug: 'backend', skillsCount: 8 },
  { id: 'cat-3', name: 'DevOps', slug: 'devops', skillsCount: 6 },
  { id: 'cat-4', name: 'Mobile', slug: 'mobile', skillsCount: 5 },
  { id: 'cat-5', name: 'Database', slug: 'database', skillsCount: 7 },
];

const MOCK_SKILLS: Skill[] = [
  // Frontend
  { id: 'skill-1', name: 'React', slug: 'react', categoryId: 'cat-1', categoryName: 'Frontend', description: 'JavaScript library for building UI', isActive: true, candidatesCount: 45, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-2', name: 'TypeScript', slug: 'typescript', categoryId: 'cat-1', categoryName: 'Frontend', description: 'Typed superset of JavaScript', isActive: true, candidatesCount: 38, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-3', name: 'Vue.js', slug: 'vuejs', categoryId: 'cat-1', categoryName: 'Frontend', description: 'Progressive JavaScript framework', isActive: true, candidatesCount: 25, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-4', name: 'Angular', slug: 'angular', categoryId: 'cat-1', categoryName: 'Frontend', description: 'Platform for building web apps', isActive: true, candidatesCount: 18, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-5', name: 'Next.js', slug: 'nextjs', categoryId: 'cat-1', categoryName: 'Frontend', description: 'React framework for production', isActive: true, candidatesCount: 32, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-6', name: 'Tailwind CSS', slug: 'tailwindcss', categoryId: 'cat-1', categoryName: 'Frontend', description: 'Utility-first CSS framework', isActive: true, candidatesCount: 41, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  
  // Backend
  { id: 'skill-7', name: 'Node.js', slug: 'nodejs', categoryId: 'cat-2', categoryName: 'Backend', description: 'JavaScript runtime environment', isActive: true, candidatesCount: 42, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-8', name: 'Python', slug: 'python', categoryId: 'cat-2', categoryName: 'Backend', description: 'High-level programming language', isActive: true, candidatesCount: 35, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-9', name: 'Go', slug: 'go', categoryId: 'cat-2', categoryName: 'Backend', description: 'Statically typed compiled language', isActive: true, candidatesCount: 22, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-10', name: 'Java', slug: 'java', categoryId: 'cat-2', categoryName: 'Backend', description: 'Object-oriented programming language', isActive: true, candidatesCount: 28, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-11', name: 'NestJS', slug: 'nestjs', categoryId: 'cat-2', categoryName: 'Backend', description: 'Progressive Node.js framework', isActive: true, candidatesCount: 24, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  
  // DevOps
  { id: 'skill-12', name: 'Docker', slug: 'docker', categoryId: 'cat-3', categoryName: 'DevOps', description: 'Container platform', isActive: true, candidatesCount: 38, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-13', name: 'Kubernetes', slug: 'kubernetes', categoryId: 'cat-3', categoryName: 'DevOps', description: 'Container orchestration', isActive: true, candidatesCount: 26, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-14', name: 'AWS', slug: 'aws', categoryId: 'cat-3', categoryName: 'DevOps', description: 'Amazon Web Services', isActive: true, candidatesCount: 34, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-15', name: 'Terraform', slug: 'terraform', categoryId: 'cat-3', categoryName: 'DevOps', description: 'Infrastructure as Code', isActive: true, candidatesCount: 19, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-16', name: 'Jenkins', slug: 'jenkins', categoryId: 'cat-3', categoryName: 'DevOps', description: 'Automation server', isActive: false, candidatesCount: 12, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  
  // Mobile
  { id: 'skill-17', name: 'React Native', slug: 'react-native', categoryId: 'cat-4', categoryName: 'Mobile', description: 'Cross-platform mobile framework', isActive: true, candidatesCount: 29, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-18', name: 'Flutter', slug: 'flutter', categoryId: 'cat-4', categoryName: 'Mobile', description: 'Google UI toolkit', isActive: true, candidatesCount: 21, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-19', name: 'Swift', slug: 'swift', categoryId: 'cat-4', categoryName: 'Mobile', description: 'iOS programming language', isActive: true, candidatesCount: 17, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  
  // Database
  { id: 'skill-20', name: 'PostgreSQL', slug: 'postgresql', categoryId: 'cat-5', categoryName: 'Database', description: 'Relational database', isActive: true, candidatesCount: 36, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-21', name: 'MongoDB', slug: 'mongodb', categoryId: 'cat-5', categoryName: 'Database', description: 'NoSQL document database', isActive: true, candidatesCount: 31, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 'skill-22', name: 'Redis', slug: 'redis', categoryId: 'cat-5', categoryName: 'Database', description: 'In-memory data store', isActive: true, candidatesCount: 27, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
];

let mockSkillsData = [...MOCK_SKILLS];

// ========================================
// ADMIN API - Skills Management
// ========================================

/**
 * Get all skills with filters (Admin)
 * TODO: Replace with: GET /api/admin/skills
 */
export async function listSkills(filters: SkillFilters = {}): Promise<SkillsListResponse> {
  // MOCK IMPLEMENTATION
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
  
  let filtered = [...mockSkillsData];
  
  // Apply filters
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(searchLower) ||
      s.slug.toLowerCase().includes(searchLower) ||
      s.description?.toLowerCase().includes(searchLower)
    );
  }
  
  if (filters.categoryId) {
    filtered = filtered.filter(s => s.categoryId === filters.categoryId);
  }
  
  if (filters.isActive !== undefined) {
    filtered = filtered.filter(s => s.isActive === filters.isActive);
  }
  
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
  // if (filters.page) params.append('page', String(filters.page));
  // if (filters.limit) params.append('limit', String(filters.limit));
  // if (filters.search) params.append('search', filters.search);
  // if (filters.categoryId) params.append('categoryId', filters.categoryId);
  // if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
  // return apiGet<SkillsListResponse>(`/api/admin/skills?${params}`);
}

/**
 * Get skill by ID (Admin)
 * TODO: Replace with: GET /api/admin/skills/:id
 */
export async function getSkill(id: string): Promise<Skill> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 200));
  const skill = mockSkillsData.find(s => s.id === id);
  if (!skill) throw new Error('Skill not found');
  return skill;
  
  // REAL API:
  // return apiGet<Skill>(`/api/admin/skills/${id}`);
}

/**
 * Create new skill (Admin)
 * TODO: Replace with: POST /api/admin/skills
 */
export async function createSkill(dto: CreateSkillDto): Promise<Skill> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const category = MOCK_CATEGORIES.find(c => c.id === dto.categoryId);
  const newSkill: Skill = {
    id: `skill-${Date.now()}`,
    name: dto.name,
    slug: dto.slug,
    categoryId: dto.categoryId || 'cat-1',
    categoryName: category?.name || 'Uncategorized',
    description: dto.description,
    isActive: true,
    candidatesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockSkillsData.push(newSkill);
  return newSkill;
  
  // REAL API:
  // return apiPost<Skill>('/api/admin/skills', dto);
}

/**
 * Update skill (Admin)
 * TODO: Replace with: PUT /api/admin/skills/:id
 */
export async function updateSkill(id: string, dto: UpdateSkillDto): Promise<Skill> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const index = mockSkillsData.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Skill not found');
  
  const category = dto.categoryId ? MOCK_CATEGORIES.find(c => c.id === dto.categoryId) : undefined;
  
  mockSkillsData[index] = {
    ...mockSkillsData[index],
    name: dto.name || mockSkillsData[index].name,
    description: dto.description !== undefined ? dto.description : mockSkillsData[index].description,
    categoryId: dto.categoryId || mockSkillsData[index].categoryId,
    categoryName: category?.name || mockSkillsData[index].categoryName,
    updatedAt: new Date().toISOString(),
  };
  
  return mockSkillsData[index];
  
  // REAL API:
  // return apiPut<Skill>(`/api/admin/skills/${id}`, dto);
}

/**
 * Toggle skill active status (Admin)
 * TODO: Replace with: PATCH /api/admin/skills/:id/toggle
 */
export async function toggleSkillStatus(id: string): Promise<Skill> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const index = mockSkillsData.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Skill not found');
  
  mockSkillsData[index] = {
    ...mockSkillsData[index],
    isActive: !mockSkillsData[index].isActive,
    updatedAt: new Date().toISOString(),
  };
  
  return mockSkillsData[index];
  
  // REAL API:
  // return apiPost<Skill>(`/api/admin/skills/${id}/toggle`, {});
}

/**
 * Delete skill (Admin)
 * TODO: Replace with: DELETE /api/admin/skills/:id
 */
export async function deleteSkill(id: string): Promise<{ success: boolean; message: string }> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const index = mockSkillsData.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Skill not found');
  
  mockSkillsData.splice(index, 1);
  
  return { success: true, message: 'Skill deleted successfully' };
  
  // REAL API:
  // return apiDelete<{ success: boolean; message: string }>(`/api/admin/skills/${id}`);
}

/**
 * Get all skill categories
 * TODO: Replace with: GET /api/skills/categories
 */
export async function listCategories(): Promise<SkillCategory[]> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 200));
  return MOCK_CATEGORIES;
  
  // REAL API:
  // return apiGet<SkillCategory[]>('/api/skills/categories');
}
