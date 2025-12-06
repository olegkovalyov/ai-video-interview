// Template Queries
export * from './get-template';
export * from './list-templates';
export * from './get-template-questions';

// Invitation Queries
export * from './get-invitation';
export * from './list-candidate-invitations';
export * from './list-hr-invitations';

// Query Handlers array for module registration
import { GetTemplateHandler } from './get-template';
import { ListTemplatesHandler } from './list-templates';
import { GetTemplateQuestionsHandler } from './get-template-questions';
import { GetInvitationHandler } from './get-invitation';
import { ListCandidateInvitationsHandler } from './list-candidate-invitations';
import { ListHRInvitationsHandler } from './list-hr-invitations';

export const QueryHandlers = [
  // Template handlers
  GetTemplateHandler,
  ListTemplatesHandler,
  GetTemplateQuestionsHandler,
  // Invitation handlers
  GetInvitationHandler,
  ListCandidateInvitationsHandler,
  ListHRInvitationsHandler,
];
