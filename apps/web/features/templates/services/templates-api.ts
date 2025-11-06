/**
 * Templates API Service
 * 
 * TODO: Replace mock implementation with real API calls to API Gateway
 * 
 * Real implementation will use:
 * - apiGet('/api/templates', ...)
 * - apiPost('/api/templates', ...)
 * - apiPut('/api/templates/:id', ...)
 * - apiDelete('/api/templates/:id')
 */

import {
  Template,
  PaginatedTemplates,
  CreateTemplateDto,
  UpdateTemplateDto,
  AddQuestionDto,
  Question,
  TemplateStats,
  TemplateFilters,
} from '../types/template.types';
import { MOCK_TEMPLATES, MOCK_QUESTIONS, MOCK_STATS, delay } from './mock-data';

/**
 * Get paginated list of templates
 * 
 * TODO: Replace with:
 * return apiGet<PaginatedTemplates>('/api/templates', { params: { page, limit, status } });
 */
export async function listTemplates(
  page: number = 1,
  limit: number = 10,
  filters?: TemplateFilters,
): Promise<PaginatedTemplates> {
  await delay(500); // Simulate network delay

  let filtered = [...MOCK_TEMPLATES];

  // Apply status filter
  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter(t => t.status === filters.status);
  }

  // Apply search filter
  if (filters?.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(
      t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query),
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Get single template by ID
 * 
 * TODO: Replace with:
 * return apiGet<Template>(`/api/templates/${id}`);
 */
export async function getTemplate(id: string): Promise<Template> {
  await delay(300);

  const template = MOCK_TEMPLATES.find(t => t.id === id);
  if (!template) {
    throw new Error('Template not found');
  }

  // Add questions to detail view
  return {
    ...template,
    questions: MOCK_QUESTIONS,
  };
}

/**
 * Create new template
 * 
 * TODO: Replace with:
 * return apiPost<{ id: string }>('/api/templates', dto);
 */
export async function createTemplate(dto: CreateTemplateDto): Promise<{ id: string }> {
  await delay(800);

  const newTemplate: Template = {
    id: `tpl-${Date.now()}`,
    ...dto,
    status: 'draft',
    createdBy: 'current-user-id', // Will come from auth context
    questionsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  MOCK_TEMPLATES.unshift(newTemplate);

  return { id: newTemplate.id };
}

/**
 * Update template
 * 
 * TODO: Replace with:
 * return apiPut<Template>(`/api/templates/${id}`, dto);
 */
export async function updateTemplate(id: string, dto: UpdateTemplateDto): Promise<Template> {
  await delay(500);

  const index = MOCK_TEMPLATES.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Template not found');
  }

  MOCK_TEMPLATES[index] = {
    ...MOCK_TEMPLATES[index],
    ...dto,
    updatedAt: new Date().toISOString(),
  };

  return MOCK_TEMPLATES[index];
}

/**
 * Delete (archive) template
 * 
 * TODO: Replace with:
 * return apiDelete(`/api/templates/${id}`);
 */
export async function deleteTemplate(id: string): Promise<void> {
  await delay(400);

  const index = MOCK_TEMPLATES.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Template not found');
  }

  // Soft delete - change status to archived
  MOCK_TEMPLATES[index].status = 'archived';
  MOCK_TEMPLATES[index].updatedAt = new Date().toISOString();
}

/**
 * Publish template (draft → active)
 * 
 * TODO: Replace with:
 * return apiPut<{ status: string }>(`/api/templates/${id}/publish`, {});
 */
export async function publishTemplate(id: string): Promise<{ status: string }> {
  await delay(500);

  const index = MOCK_TEMPLATES.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Template not found');
  }

  if (MOCK_TEMPLATES[index].status !== 'draft') {
    throw new Error('Only draft templates can be published');
  }

  MOCK_TEMPLATES[index].status = 'active';
  MOCK_TEMPLATES[index].updatedAt = new Date().toISOString();

  return { status: 'active' };
}

/**
 * Duplicate template
 * 
 * TODO: Replace with:
 * const original = await apiGet<Template>(`/api/templates/${id}`);
 * return apiPost<{ id: string }>('/api/templates', { ...original, title: `${original.title} (Copy)` });
 */
export async function duplicateTemplate(id: string): Promise<{ id: string }> {
  await delay(700);

  const original = MOCK_TEMPLATES.find(t => t.id === id);
  if (!original) {
    throw new Error('Template not found');
  }

  const duplicate: Template = {
    ...original,
    id: `tpl-${Date.now()}`,
    title: `${original.title} (Copy)`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  MOCK_TEMPLATES.unshift(duplicate);

  return { id: duplicate.id };
}

// ════════════════════════════════════════════════════════════════
// Questions API
// ════════════════════════════════════════════════════════════════

/**
 * Get questions for template
 * 
 * TODO: Replace with:
 * return apiGet<{ questions: Question[] }>(`/api/templates/${templateId}/questions`);
 */
export async function getQuestions(templateId: string): Promise<{ questions: Question[] }> {
  await delay(300);
  return { questions: MOCK_QUESTIONS };
}

/**
 * Add question to template
 * 
 * TODO: Replace with:
 * return apiPost<{ id: string }>(`/api/templates/${templateId}/questions`, dto);
 */
export async function addQuestion(
  templateId: string,
  dto: AddQuestionDto,
): Promise<{ id: string }> {
  await delay(500);

  const newQuestion: Question = {
    id: `q-${Date.now()}`,
    ...dto,
    createdAt: new Date().toISOString(),
  };

  MOCK_QUESTIONS.push(newQuestion);

  // Update questions count
  const template = MOCK_TEMPLATES.find(t => t.id === templateId);
  if (template) {
    template.questionsCount++;
    template.updatedAt = new Date().toISOString();
  }

  return { id: newQuestion.id };
}

/**
 * Remove question from template
 * 
 * TODO: Replace with:
 * return apiDelete(`/api/templates/${templateId}/questions/${questionId}`);
 */
export async function removeQuestion(templateId: string, questionId: string): Promise<void> {
  await delay(400);

  const index = MOCK_QUESTIONS.findIndex(q => q.id === questionId);
  if (index !== -1) {
    MOCK_QUESTIONS.splice(index, 1);
  }

  // Update questions count
  const template = MOCK_TEMPLATES.find(t => t.id === templateId);
  if (template) {
    template.questionsCount = Math.max(0, template.questionsCount - 1);
    template.updatedAt = new Date().toISOString();
  }
}

// ════════════════════════════════════════════════════════════════
// Stats API
// ════════════════════════════════════════════════════════════════

/**
 * Get template statistics
 * 
 * TODO: Replace with:
 * return apiGet<TemplateStats>('/api/templates/stats');
 */
export async function getTemplateStats(): Promise<TemplateStats> {
  await delay(200);

  return {
    total: MOCK_TEMPLATES.length,
    active: MOCK_TEMPLATES.filter(t => t.status === 'active').length,
    draft: MOCK_TEMPLATES.filter(t => t.status === 'draft').length,
    archived: MOCK_TEMPLATES.filter(t => t.status === 'archived').length,
  };
}
