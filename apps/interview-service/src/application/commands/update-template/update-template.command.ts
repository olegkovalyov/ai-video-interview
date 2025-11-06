import { ICommand } from '@nestjs/cqrs';
import { InterviewSettings } from '../../../domain/value-objects/interview-settings.vo';

export class UpdateTemplateCommand implements ICommand {
  constructor(
    public readonly templateId: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly settings?: InterviewSettings,
  ) {}
}
