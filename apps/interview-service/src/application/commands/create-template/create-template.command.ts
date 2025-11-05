import { ICommand } from '@nestjs/cqrs';
import { InterviewSettings } from '../../../domain/value-objects/interview-settings.vo';

export class CreateTemplateCommand implements ICommand {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly createdBy: string,
    public readonly settings?: InterviewSettings,
  ) {}
}
