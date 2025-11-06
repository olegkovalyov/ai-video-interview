import { ICommand } from '@nestjs/cqrs';

export class DeleteTemplateCommand implements ICommand {
  constructor(public readonly templateId: string) {}
}
