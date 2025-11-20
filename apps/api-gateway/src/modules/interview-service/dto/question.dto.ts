import { ApiProperty } from '@nestjs/swagger';

/**
 * Question Option DTO
 * For multiple choice questions
 */
export class QuestionOptionDto {
  @ApiProperty({
    description: 'Answer option text',
    example: 'Paris',
    minLength: 1,
    maxLength: 200,
  })
  text: string;

  @ApiProperty({
    description: 'Whether this option is a correct answer',
    example: true,
  })
  isCorrect: boolean;
}

/**
 * Question Option Response DTO
 */
export class QuestionOptionResponseDto {
  @ApiProperty({
    description: 'Option ID',
    example: 'opt-123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Answer option text',
    example: 'Paris',
  })
  text: string;

  @ApiProperty({
    description: 'Whether this option is correct',
    example: true,
  })
  isCorrect: boolean;
}

/**
 * Add Question DTO
 * Creates a new question in the template
 */
export class AddQuestionDto {
  @ApiProperty({
    description: 'Question text',
    example: 'Describe your experience with microservices architecture and event-driven design patterns.',
    minLength: 10,
    maxLength: 500,
  })
  text: string;

  @ApiProperty({
    description: 'Type of question response',
    enum: ['video', 'text', 'multiple_choice'],
    example: 'video',
  })
  type: 'video' | 'text' | 'multiple_choice';

  @ApiProperty({
    description: 'Display order of the question (1-based)',
    example: 1,
    minimum: 1,
  })
  order: number;

  @ApiProperty({
    description: 'Time limit for answering the question in seconds',
    example: 180,
    minimum: 30,
    maximum: 600,
  })
  timeLimit: number;

  @ApiProperty({
    description: 'Whether this question is mandatory',
    example: true,
  })
  required: boolean;

  @ApiProperty({
    description: 'Optional hints for the candidate',
    example: 'Focus on real-world examples from your previous projects',
    maxLength: 200,
    required: false,
  })
  hints?: string;

  @ApiProperty({
    description: 'Answer options for multiple choice questions (required for multiple_choice type)',
    type: [QuestionOptionDto],
    required: false,
    example: [
      { text: 'Paris', isCorrect: true },
      { text: 'London', isCorrect: false },
      { text: 'Berlin', isCorrect: false },
    ],
  })
  options?: QuestionOptionDto[];
}

/**
 * Question Response DTO
 */
export class QuestionResponseDto {
  @ApiProperty({
    description: 'Question UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Question text',
    example: 'Describe your experience with microservices',
  })
  text: string;

  @ApiProperty({
    description: 'Question type',
    enum: ['video', 'text', 'multiple_choice'],
    example: 'video',
  })
  type: 'video' | 'text' | 'multiple_choice';

  @ApiProperty({
    description: 'Display order (1-based)',
    example: 1,
  })
  order: number;

  @ApiProperty({
    description: 'Time limit in seconds',
    example: 180,
  })
  timeLimit: number;

  @ApiProperty({
    description: 'Whether question is mandatory',
    example: true,
  })
  required: boolean;

  @ApiProperty({
    description: 'Optional hints for candidates',
    example: 'Focus on real-world examples',
    required: false,
  })
  hints?: string;

  @ApiProperty({
    description: 'Answer options for multiple choice questions',
    type: [QuestionOptionResponseDto],
    required: false,
  })
  options?: QuestionOptionResponseDto[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-11-05T22:00:00Z',
    type: String,
    format: 'date-time',
  })
  createdAt: string;
}

/**
 * Reorder Questions DTO
 * Updates the order of all questions in a template
 */
export class ReorderQuestionsDto {
  @ApiProperty({
    description: 'Array of question IDs in desired order. Must include all questions.',
    example: ['q3-uuid-here', 'q1-uuid-here', 'q2-uuid-here'],
    type: [String],
  })
  questionIds: string[];
}

/**
 * Get Questions Response DTO
 */
export class GetQuestionsResponseDto {
  @ApiProperty({
    description: 'List of questions',
    type: [QuestionResponseDto],
  })
  questions: QuestionResponseDto[];
}

/**
 * Add Question Response DTO
 */
export class AddQuestionResponseDto {
  @ApiProperty({
    description: 'Created question ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;
}
