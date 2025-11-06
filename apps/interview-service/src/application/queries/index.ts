// Queries
export * from './get-template';
export * from './list-templates';
export * from './get-template-questions';

// Query Handlers array for module registration
import { GetTemplateHandler } from './get-template';
import { ListTemplatesHandler } from './list-templates';
import { GetTemplateQuestionsHandler } from './get-template-questions';

export const QueryHandlers = [
  GetTemplateHandler,
  ListTemplatesHandler,
  GetTemplateQuestionsHandler,
];
