import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum QuestionTypeDto {
  VIDEO = 'video',
  TEXT = 'text',
  MULTIPLE_CHOICE = 'multiple_choice',
}

export class AddQuestionDto {
  @ApiProperty({ 
    description: 'Question text', 
    minLength: 10,
    maxLength: 500,
    example: 'Describe your experience with microservices architecture and event-driven design patterns.'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  text: string;

  @ApiProperty({ 
    description: 'Type of question response',
    enum: QuestionTypeDto,
    example: QuestionTypeDto.VIDEO
  })
  @IsEnum(QuestionTypeDto)
  type: QuestionTypeDto;

  @ApiProperty({ 
    description: 'Display order of the question (1-based)',
    minimum: 1,
    example: 1
  })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiProperty({ 
    description: 'Time limit for answering the question in seconds',
    minimum: 30,
    maximum: 600,
    example: 180
  })
  @IsNumber()
  @Min(30)
  @Max(600)
  timeLimit: number;

  @ApiProperty({ 
    description: 'Whether this question is mandatory',
    example: true
  })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ 
    description: 'Optional hints for the candidate',
    maxLength: 200,
    example: 'Focus on real-world examples from your previous projects'
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  hints?: string;
}
