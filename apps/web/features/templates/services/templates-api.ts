/**
 * Templates API Service
 * 
 * Real API implementation with API Gateway integration
 * All endpoints: http://localhost:8001/api/templates
 */

import {
  Template,
  PaginatedTemplates,
  CreateTemplateDto,
  UpdateTemplateDto,
  AddQuestionDto,
  ReorderQuestionsDto,
  Question,
  TemplateStats,
  TemplateFilters,
} from '../types/template.types';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete, ApiError } from '@/lib/api';
import { logger } from '@/lib/logger';

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Get paginated list of templates
 */
export async function listTemplates(
  page: number = 1,
  limit: number = 10,
  filters?: TemplateFilters,
): Promise<PaginatedTemplates> {
  // Build query params
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (filters?.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  
  const url = `/api/templates?${params.toString()}`;
  
  logger.debug('API GET', url, { page, limit, status: filters?.status || 'all' });

  const result = await apiGet<PaginatedTemplates>(url);

  // Apply client-side search filter if needed (API doesn't support search yet)
  let items = result.items;
  if (filters?.search) {
    const query = filters.search.toLowerCase();
    items = items.filter(
      t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query),
    );
  }

  logger.debug('listTemplates response', { total: result.total, itemsCount: items.length, page: result.page, totalPages: result.totalPages });
  
  return { ...result, items };
}

/**
 * Get single template by ID
 */
export async function getTemplate(id: string): Promise<Template> {
  const url = `/api/templates/${id}`;
  
  logger.debug('API GET', url, { templateId: id });

  const result = await apiGet<Template>(url);

  logger.debug('getTemplate response', { id: result.id, title: result.title, status: result.status, questionsCount: result.questionsCount });
  
  return result;
}

/**
 * Create new template
 */
export async function createTemplate(dto: CreateTemplateDto): Promise<{ id: string }> {
  const url = '/api/templates';
  
  logger.debug('API POST', url, dto);

  const result = await apiPost<{ id: string }>(url, dto);

  logger.debug('createTemplate response', result);
  
  return result;
}

/**
 * Update template
 */
export async function updateTemplate(id: string, dto: UpdateTemplateDto): Promise<Template> {
  const url = `/api/templates/${id}`;
  
  logger.debug('API PUT', url, dto);

  const result = await apiPut<Template>(url, dto);

  logger.debug('updateTemplate response', { id: result.id, title: result.title, status: result.status });
  
  return result;
}

/**
 * Delete (archive) template
 */
export async function deleteTemplate(id: string): Promise<void> {
  const url = `/api/templates/${id}`;
  
  logger.debug('API DELETE', url, { templateId: id });

  await apiDelete<void>(url);

  logger.debug('Template deleted (archived)', { templateId: id });
}

/**
 * Publish template (draft → active)
 */
export async function publishTemplate(id: string): Promise<{ status: string }> {
  const url = `/api/templates/${id}/publish`;
  
  logger.debug('API PUT', url, { templateId: id });

  const result = await apiPut<{ status: string }>(url, {});

  logger.debug('publishTemplate response', result);
  
  return result;
}

/**
 * Duplicate template
 */
export async function duplicateTemplate(id: string): Promise<{ id: string }> {
  logger.debug('Duplicating template', { templateId: id });

  // Get original template
  const original = await getTemplate(id);
  
  // Create duplicate with new title
  const dto: CreateTemplateDto = {
    title: `${original.title} (Copy)`,
    description: original.description,
    settings: original.settings,
  };
  
  const result = await createTemplate(dto);
  
  logger.debug('Template duplicated', { newTemplateId: result.id });
  
  return result;
}

// ════════════════════════════════════════════════════════════════
// Questions API
// ════════════════════════════════════════════════════════════════

/**
 * Get questions for template
 */
export async function getQuestions(templateId: string): Promise<{ questions: Question[] }> {
  const url = `/api/templates/${templateId}/questions`;
  
  logger.debug('API GET', url, { templateId });

  const result = await apiGet<{ questions: Question[] }>(url);

  logger.debug('getQuestions response', { questionsCount: result.questions.length });
  
  return result;
}

/**
 * Add question to template
 */
export async function addQuestion(
  templateId: string,
  dto: AddQuestionDto,
): Promise<{ id: string }> {
  const url = `/api/templates/${templateId}/questions`;
  return await apiPost<{ id: string }>(url, dto);
}

/**
 * Remove question from template
 */
export async function removeQuestion(templateId: string, questionId: string): Promise<void> {
  const url = `/api/templates/${templateId}/questions/${questionId}`;
  await apiDelete<void>(url);
}

/**
 * Reorder questions in template
 */
export async function reorderQuestions(
  templateId: string,
  dto: ReorderQuestionsDto,
): Promise<void> {
  const url = `/api/templates/${templateId}/questions/reorder`;
  await apiPatch<void>(url, dto);
}

// ════════════════════════════════════════════════════════════════
// Stats API
// ════════════════════════════════════════════════════════════════

/**
 * Get template statistics
 * Note: API doesn't have this endpoint yet, calculating client-side
 */
export async function getTemplateStats(): Promise<TemplateStats> {
  logger.debug('Calculating template stats (client-side)');

  // Get all templates and calculate stats
  const allTemplates = await listTemplates(1, 1000);
  const templates = allTemplates.items;
  
  const result = {
    total: templates.length,
    active: templates.filter(t => t.status === 'active').length,
    draft: templates.filter(t => t.status === 'draft').length,
    archived: templates.filter(t => t.status === 'archived').length,
  };
  
  logger.debug('Stats calculated', result);
  
  return result;
}
