// Commands
export * from './create-template';
export * from './add-question';
export * from './remove-question';
export * from './publish-template';
export * from './update-template';
export * from './delete-template';

// Command Handlers array for module registration
import { CreateTemplateHandler } from './create-template';
import { AddQuestionHandler } from './add-question';
import { RemoveQuestionHandler } from './remove-question';
import { PublishTemplateHandler } from './publish-template';
import { UpdateTemplateHandler } from './update-template';
import { DeleteTemplateHandler } from './delete-template';

export const CommandHandlers = [
  CreateTemplateHandler,
  AddQuestionHandler,
  RemoveQuestionHandler,
  PublishTemplateHandler,
  UpdateTemplateHandler,
  DeleteTemplateHandler,
];
