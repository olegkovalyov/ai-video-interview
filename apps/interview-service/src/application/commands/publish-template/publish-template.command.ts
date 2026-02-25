import { ICommand } from '@nestjs/cqrs';

export class PublishTemplateCommand implements ICommand {
  constructor(
    public readonly templateId: string,
    public readonly userId?: string,
    public readonly userRole?: string,
  ) {}
}
