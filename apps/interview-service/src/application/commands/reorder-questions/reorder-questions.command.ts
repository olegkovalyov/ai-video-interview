import { ICommand } from '@nestjs/cqrs';

export class ReorderQuestionsCommand implements ICommand {
  constructor(
    public readonly templateId: string,
    public readonly questionIds: string[],
  ) {}
}
