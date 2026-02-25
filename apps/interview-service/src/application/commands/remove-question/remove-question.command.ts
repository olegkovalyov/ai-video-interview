import { ICommand } from '@nestjs/cqrs';

export class RemoveQuestionCommand implements ICommand {
  constructor(
    public readonly templateId: string,
    public readonly questionId: string,
    public readonly userId?: string,
    public readonly userRole?: string,
  ) {}
}
