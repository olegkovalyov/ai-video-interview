import { ICommand } from '@nestjs/cqrs';

export class AddQuestionCommand implements ICommand {
  constructor(
    public readonly templateId: string,
    public readonly questionId: string,
    public readonly text: string,
    public readonly type: string, // 'video' | 'text' | 'multiple_choice'
    public readonly order: number,
    public readonly timeLimit: number,
    public readonly required: boolean,
    public readonly hints?: string,
  ) {}
}
