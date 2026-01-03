import { IsString, IsArray, IsOptional, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class QuestionOptionDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  text: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect: boolean;
}

class QuestionDto {
  @ApiProperty({ example: 'q-1' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'What is dependency injection?' })
  @IsString()
  text: string;

  @ApiProperty({ enum: ['text', 'multiple_choice', 'video', 'code'] })
  @IsString()
  type: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  orderIndex: number;

  @ApiPropertyOptional({ type: [QuestionOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];
}

class ResponseDto {
  @ApiProperty({ example: 'r-1' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'q-1' })
  @IsString()
  questionId: string;

  @ApiPropertyOptional({ example: 'Dependency injection is a design pattern...' })
  @IsOptional()
  @IsString()
  textAnswer?: string;

  @ApiPropertyOptional({ example: 'opt-1' })
  @IsOptional()
  @IsString()
  selectedOptionId?: string;
}

export class AnalyzeRequestDto {
  @ApiProperty({ example: 'inv-test-123' })
  @IsString()
  invitationId: string;

  @ApiProperty({ example: 'cand-456' })
  @IsString()
  candidateId: string;

  @ApiProperty({ example: 'tmpl-789' })
  @IsString()
  templateId: string;

  @ApiProperty({ example: 'Senior Developer Interview' })
  @IsString()
  templateTitle: string;

  @ApiProperty({ example: 'Tech Corp' })
  @IsString()
  companyName: string;

  @ApiProperty({ type: [QuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];

  @ApiProperty({ type: [ResponseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponseDto)
  responses: ResponseDto[];

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsOptional()
  @IsString()
  language?: string;
}
