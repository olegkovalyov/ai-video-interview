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

export enum QuestionTypeDto {
  VIDEO = 'video',
  TEXT = 'text',
  MULTIPLE_CHOICE = 'multiple_choice',
}

export class AddQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  text: string;

  @IsEnum(QuestionTypeDto)
  type: QuestionTypeDto;

  @IsNumber()
  @Min(1)
  order: number;

  @IsNumber()
  @Min(30)
  @Max(600)
  timeLimit: number;

  @IsBoolean()
  required: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  hints?: string;
}
