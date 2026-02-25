/**
 * Templates API Client
 * Methods for working with Interview Templates via API Gateway
 */

import { apiGet } from '@/lib/api';

// ========================================
// TYPES
// ========================================

export interface Template {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  questionsCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'video';
  order: number;
  timeLimit?: number;
  required: boolean;
  options?: {
    text: string;
    isCorrect: boolean;
  }[];
}

export interface TemplateWithQuestions extends Template {
  questions: TemplateQuestion[];
}

export interface TemplatesListResponse {
  data: Template[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TemplateFilters {
  status?: 'draft' | 'active' | 'archived';
  page?: number;
  limit?: number;
}

// ========================================
// API FUNCTIONS
// ========================================

/**
 * List templates with optional filters
 * GET /api/templates
 */
export async function listTemplates(filters: TemplateFilters = {}): Promise<TemplatesListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  
  const queryString = params.toString();
  const url = queryString ? `/api/templates?${queryString}` : '/api/templates';
  
  return apiGet<TemplatesListResponse>(url);
}

/**
 * Get template by ID with questions
 * GET /api/templates/:id
 */
export async function getTemplate(id: string): Promise<TemplateWithQuestions> {
  return apiGet<TemplateWithQuestions>(`/api/templates/${id}`);
}

/**
 * List active templates only (for invitation forms)
 * Convenience wrapper for listTemplates({ status: 'active' })
 */
export async function listActiveTemplates(): Promise<Template[]> {
  const response = await listTemplates({ status: 'active', limit: 100 });
  return response.data || [];
}
