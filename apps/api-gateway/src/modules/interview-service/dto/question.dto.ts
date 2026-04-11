import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsIn,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Question Option DTO
 */
export class QuestionOptionDto {
  @ApiProperty({ description: 'Answer option text', example: 'Paris' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  text: string;

  @ApiProperty({ description: 'Whether this option is correct', example: true })
  @IsBoolean()
  isCorrect: boolean;
}

/**
 * Question Option Response DTO
 */
export class QuestionOptionResponseDto {
  @ApiProperty({ example: 'opt-123' })
  id: string;

  @ApiProperty({ example: 'Paris' })
  text: string;

  @ApiProperty({ example: true })
  isCorrect: boolean;
}

/**
 * Add Question DTO
 */
export class AddQuestionDto {
  @ApiProperty({
    description: 'Question text',
    example: 'Describe your experience with microservices.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  text: string;

  @ApiProperty({
    description: 'Question type',
    enum: ['video', 'text', 'multiple_choice'],
    example: 'video',
  })
  @IsString()
  @IsIn(['video', 'text', 'multiple_choice'])
  type: 'video' | 'text' | 'multiple_choice';

  @ApiProperty({ description: 'Display order (1-based)', example: 1 })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({ description: 'Time limit in seconds', example: 180 })
  @IsInt()
  @Min(30)
  @Max(600)
  timeLimit: number;

  @ApiProperty({ description: 'Whether question is mandatory', example: true })
  @IsBoolean()
  required: boolean;

  @ApiProperty({ description: 'Hints for the candidate', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  hints?: string;

  @ApiProperty({
    description: 'Options for multiple choice',
    type: [QuestionOptionDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];
}

/**
 * Question Response DTO
 */
export class QuestionResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Describe your experience with microservices' })
  text: string;

  @ApiProperty({ enum: ['video', 'text', 'multiple_choice'], example: 'video' })
  type: 'video' | 'text' | 'multiple_choice';

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: 180 })
  timeLimit: number;

  @ApiProperty({ example: true })
  required: boolean;

  @ApiProperty({ required: false })
  hints?: string;

  @ApiProperty({ type: [QuestionOptionResponseDto], required: false })
  options?: QuestionOptionResponseDto[];

  @ApiProperty({ example: '2024-11-05T22:00:00Z' })
  createdAt: string;
}

/**
 * Reorder Questions DTO
 */
export class ReorderQuestionsDto {
  @ApiProperty({ description: 'Question IDs in desired order', type: [String] })
  @IsArray()
  @IsString({ each: true })
  questionIds: string[];
}

/**
 * Get Questions Response DTO
 */
export class GetQuestionsResponseDto {
  @ApiProperty({ type: [QuestionResponseDto] })
  questions: QuestionResponseDto[];
}

/**
 * Add Question Response DTO
 */
export class AddQuestionResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;
}
