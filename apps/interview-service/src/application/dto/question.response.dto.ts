import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuestionOptionResponseDto {
  @ApiProperty({ description: 'Option ID', example: 'opt-123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Answer option text', example: 'Paris' })
  text: string;

  @ApiProperty({ description: 'Whether this option is correct', example: true })
  isCorrect: boolean;
}

export class QuestionResponseDto {
  @ApiProperty({ description: 'Question UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Question text', example: 'Describe your experience with microservices' })
  text: string;

  @ApiProperty({ description: 'Question type', enum: ['video', 'text', 'multiple_choice'], example: 'video' })
  type: string;

  @ApiProperty({ description: 'Display order (1-based)', example: 1 })
  order: number;

  @ApiProperty({ description: 'Time limit in seconds', example: 180 })
  timeLimit: number;

  @ApiProperty({ description: 'Whether question is mandatory', example: true })
  required: boolean;

  @ApiPropertyOptional({ description: 'Optional hints for candidates', example: 'Focus on real-world examples' })
  hints?: string;

  @ApiPropertyOptional({
    description: 'Answer options for multiple choice questions',
    type: [QuestionOptionResponseDto],
    example: [
      { id: 'opt-1', text: 'Paris', isCorrect: true },
      { id: 'opt-2', text: 'London', isCorrect: false },
    ],
  })
  options?: QuestionOptionResponseDto[];

  @ApiProperty({ description: 'Creation timestamp', example: '2024-11-05T22:00:00Z' })
  createdAt: Date;
}
