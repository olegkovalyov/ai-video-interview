export class QuestionResponseDto {
  id: string;
  text: string;
  type: string; // 'video' | 'text' | 'multiple_choice'
  order: number;
  timeLimit: number;
  required: boolean;
  hints?: string;
  createdAt: Date;
}
