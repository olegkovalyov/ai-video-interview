import { ICommand } from '@nestjs/cqrs';

export class DeleteTemplateCommand implements ICommand {
  constructor(
    public readonly templateId: string,
    public readonly userId?: string,
    public readonly userRole?: string,
  ) {}
}
