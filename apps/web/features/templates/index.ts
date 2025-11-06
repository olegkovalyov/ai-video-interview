/**
 * Templates Feature
 * Public exports
 */

// Components
export { TemplatesList } from './components/TemplatesList';
export { TemplatesTable } from './components/TemplatesTable';
export { TemplateFilters } from './components/TemplateFilters';
export { TemplateStatsCards } from './components/TemplateStatsCards';
export { TemplateStatusBadge } from './components/TemplateStatusBadge';

// Types
export type {
  Template,
  Question,
  TemplateStatus,
  QuestionType,
  InterviewSettings,
  PaginatedTemplates,
  CreateTemplateDto,
  UpdateTemplateDto,
  AddQuestionDto,
  TemplateFilters,
  TemplateStats,
} from './types/template.types';

// Services (mock for now - will be replaced with real API)
export * from './services/templates-api';

// Utils
export * from './utils/template-helpers';
