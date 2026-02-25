import { ICommand } from '@nestjs/cqrs';

export interface QuestionOptionCommand {
  text: string;
  isCorrect: boolean;
}

export class AddQuestionCommand implements ICommand {
  constructor(
    public readonly templateId: string,
    public readonly text: string,
    public readonly type: string, // 'video' | 'text' | 'multiple_choice'
    public readonly order: number,
    public readonly timeLimit: number,
    public readonly required: boolean = true,
    public readonly hints?: string,
    public readonly options?: QuestionOptionCommand[], // For multiple_choice questions
    public readonly userId?: string,
    public readonly userRole?: string,
  ) {}
}
