/**
 * Templates Feature
 * Public exports
 */

// Components
export { TemplatesList } from './components/TemplatesList';
export { TemplatesTable } from './components/TemplatesTable';
// TemplateFilters component not exported - conflicts with TemplateFilters type
export { TemplateStatsCards } from './components/TemplateStatsCards';
export { TemplateStatusBadge } from './components/TemplateStatusBadge';
export { EditTemplateForm } from './components/EditTemplateForm';
export * from './components/CreateTemplateWizard';

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

// Services 
export * from './services/templates-api';
export * from './services/mock-data';
// storage.service not exported - conflicts with templates-api and not used

// Utils
export * from './utils/template-helpers';
