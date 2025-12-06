// Template Commands
export * from './create-template';
export * from './add-question';
export * from './remove-question';
export * from './reorder-questions';
export * from './publish-template';
export * from './update-template';
export * from './delete-template';

// Invitation Commands
export * from './create-invitation';
export * from './start-invitation';
export * from './submit-response';
export * from './complete-invitation';

// Command Handlers array for module registration
import { CreateTemplateHandler } from './create-template';
import { AddQuestionHandler } from './add-question';
import { RemoveQuestionHandler } from './remove-question';
import { ReorderQuestionsHandler } from './reorder-questions';
import { PublishTemplateHandler } from './publish-template';
import { UpdateTemplateHandler } from './update-template';
import { DeleteTemplateHandler } from './delete-template';
import { CreateInvitationHandler } from './create-invitation';
import { StartInvitationHandler } from './start-invitation';
import { SubmitResponseHandler } from './submit-response';
import { CompleteInvitationHandler } from './complete-invitation';

export const CommandHandlers = [
  // Template handlers
  CreateTemplateHandler,
  AddQuestionHandler,
  RemoveQuestionHandler,
  ReorderQuestionsHandler,
  PublishTemplateHandler,
  UpdateTemplateHandler,
  DeleteTemplateHandler,
  // Invitation handlers
  CreateInvitationHandler,
  StartInvitationHandler,
  SubmitResponseHandler,
  CompleteInvitationHandler,
];
