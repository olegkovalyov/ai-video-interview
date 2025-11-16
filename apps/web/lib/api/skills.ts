/**
 * Skills API Client
 * Методы для работы со Skills через API Gateway
 * 
 * ✅ Подключено к реальным API эндпоинтам
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

// ========================================
// TYPES
// ========================================

export interface Skill {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  categoryName: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
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
// ADMIN API - Skills Management
// ========================================

/**
 * Get all skills with filters (Admin)
 * GET /api/admin/skills
 */
export async function listSkills(filters: SkillFilters = {}): Promise<SkillsListResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.search) params.append('search', filters.search);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
  
  return apiGet<SkillsListResponse>(`/api/admin/skills?${params}`);
}

/**
 * Get skill by ID (Admin)
 * GET /api/admin/skills/:id
 */
export async function getSkill(id: string): Promise<Skill> {
  return apiGet<Skill>(`/api/admin/skills/${id}`);
}

/**
 * Create new skill (Admin)
 * POST /api/admin/skills
 */
export async function createSkill(dto: CreateSkillDto): Promise<Skill> {
  return apiPost<Skill>('/api/admin/skills', dto);
}

/**
 * Update skill (Admin)
 * PUT /api/admin/skills/:id
 */
export async function updateSkill(id: string, dto: UpdateSkillDto): Promise<Skill> {
  return apiPut<Skill>(`/api/admin/skills/${id}`, dto);
}

/**
 * Toggle skill active status (Admin)
 * POST /api/admin/skills/:id/toggle
 */
export async function toggleSkillStatus(id: string): Promise<Skill> {
  return apiPost<Skill>(`/api/admin/skills/${id}/toggle`, {});
}

/**
 * Delete skill (Admin)
 * DELETE /api/admin/skills/:id
 */
export async function deleteSkill(id: string): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(`/api/admin/skills/${id}`);
}

/**
 * Get all skill categories
 * GET /api/skills/categories
 */
export async function listCategories(): Promise<SkillCategory[]> {
  return apiGet<SkillCategory[]>('/api/skills/categories');
}
