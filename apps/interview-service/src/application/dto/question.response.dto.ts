import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'Creation timestamp', example: '2024-11-05T22:00:00Z' })
  createdAt: Date;
}
