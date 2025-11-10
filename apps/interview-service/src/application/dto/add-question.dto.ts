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
  ValidateNested,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum QuestionTypeDto {
  VIDEO = 'video',
  TEXT = 'text',
  MULTIPLE_CHOICE = 'multiple_choice',
}

export class QuestionOptionDto {
  @ApiProperty({
    description: 'Answer option text',
    minLength: 1,
    maxLength: 200,
    example: 'Paris',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  text: string;

  @ApiProperty({
    description: 'Whether this option is a correct answer',
    example: true,
  })
  @IsBoolean()
  isCorrect: boolean;
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

  @ApiPropertyOptional({
    description: 'Answer options for multiple choice questions (required for multiple_choice type)',
    type: [QuestionOptionDto],
    minItems: 2,
    maxItems: 10,
    example: [
      { text: 'Paris', isCorrect: true },
      { text: 'London', isCorrect: false },
      { text: 'Berlin', isCorrect: false },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];
}
