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
  
  console.log('╔════════════════════════════════════════════════════════');
  console.log('║ 📡 API CALL: GET', url);
  console.log('╠════════════════════════════════════════════════════════');
  console.log('║ Request Params:', { page, limit, status: filters?.status || 'all' });
  console.log('╚════════════════════════════════════════════════════════');

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
  
  console.log('✅ Response received:', {
    total: result.total,
    itemsCount: items.length,
    page: result.page,
    totalPages: result.totalPages,
  });
  
  return { ...result, items };
}

/**
 * Get single template by ID
 */
export async function getTemplate(id: string): Promise<Template> {
  const url = `/api/templates/${id}`;
  
  console.log('╔════════════════════════════════════════════════════════');
  console.log('║ 📡 API CALL: GET', url);
  console.log('╠════════════════════════════════════════════════════════');
  console.log('║ Template ID:', id);
  console.log('╚════════════════════════════════════════════════════════');

  const result = await apiGet<Template>(url);
  
  console.log('✅ Response received:', {
    id: result.id,
    title: result.title,
    status: result.status,
    questionsCount: result.questionsCount,
  });
  
  return result;
}

/**
 * Create new template
 */
export async function createTemplate(dto: CreateTemplateDto): Promise<{ id: string }> {
  const url = '/api/templates';
  
  console.log('╔════════════════════════════════════════════════════════');
  console.log('║ 📡 API CALL: POST', url);
  console.log('╠════════════════════════════════════════════════════════');
  console.log('║ Request Body:');
  console.log(JSON.stringify(dto, null, 2));
  console.log('╚════════════════════════════════════════════════════════');

  const result = await apiPost<{ id: string }>(url, dto);
  
  console.log('✅ Response received:', result);
  
  return result;
}

/**
 * Update template
 */
export async function updateTemplate(id: string, dto: UpdateTemplateDto): Promise<Template> {
  const url = `/api/templates/${id}`;
  
  console.log('╔════════════════════════════════════════════════════════');
  console.log('║ 📡 API CALL: PUT', url);
  console.log('╠════════════════════════════════════════════════════════');
  console.log('║ Request Body:');
  console.log(JSON.stringify(dto, null, 2));
  console.log('╚════════════════════════════════════════════════════════');

  const result = await apiPut<Template>(url, dto);
  
  console.log('✅ Response received:', {
    id: result.id,
    title: result.title,
    status: result.status,
  });
  
  return result;
}

/**
 * Delete (archive) template
 */
export async function deleteTemplate(id: string): Promise<void> {
  const url = `/api/templates/${id}`;
  
  console.log('╔════════════════════════════════════════════════════════');
  console.log('║ 📡 API CALL: DELETE', url);
  console.log('╠════════════════════════════════════════════════════════');
  console.log('║ Template ID:', id);
  console.log('╚════════════════════════════════════════════════════════');

  await apiDelete<void>(url);
  
  console.log('✅ Template deleted (archived)');
}

/**
 * Publish template (draft → active)
 */
export async function publishTemplate(id: string): Promise<{ status: string }> {
  const url = `/api/templates/${id}/publish`;
  
  console.log('╔════════════════════════════════════════════════════════');
  console.log('║ 📡 API CALL: PUT', url);
  console.log('╠════════════════════════════════════════════════════════');
  console.log('║ Template ID:', id);
  console.log('╚════════════════════════════════════════════════════════');

  const result = await apiPut<{ status: string }>(url, {});
  
  console.log('✅ Response received:', result);
  
  return result;
}

/**
 * Duplicate template
 */
export async function duplicateTemplate(id: string): Promise<{ id: string }> {
  console.log('╔════════════════════════════════════════════════════════');
  console.log('║ 🔄 Duplicating template:', id);
  console.log('╚════════════════════════════════════════════════════════');

  // Get original template
  const original = await getTemplate(id);
  
  // Create duplicate with new title
  const dto: CreateTemplateDto = {
    title: `${original.title} (Copy)`,
    description: original.description,
    settings: original.settings,
  };
  
  const result = await createTemplate(dto);
  
  console.log('✅ Template duplicated:', result.id);
  
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
  
  console.log('╔════════════════════════════════════════════════════════');
  console.log('║ 📡 API CALL: GET', url);
  console.log('╠════════════════════════════════════════════════════════');
  console.log('║ Template ID:', templateId);
  console.log('╚════════════════════════════════════════════════════════');

  const result = await apiGet<{ questions: Question[] }>(url);
  
  console.log('✅ Response received:', {
    questionsCount: result.questions.length,
  });
  
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
  console.log('╔════════════════════════════════════════════════════════');
  console.log('║ 📊 Calculating template stats (client-side)');
  console.log('╚════════════════════════════════════════════════════════');

  // Get all templates and calculate stats
  const allTemplates = await listTemplates(1, 1000);
  const templates = allTemplates.items;
  
  const result = {
    total: templates.length,
    active: templates.filter(t => t.status === 'active').length,
    draft: templates.filter(t => t.status === 'draft').length,
    archived: templates.filter(t => t.status === 'archived').length,
  };
  
  console.log('✅ Stats calculated:', result);
  
  return result;
}
