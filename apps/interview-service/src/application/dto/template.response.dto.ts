import { ApiProperty } from '@nestjs/swagger';
import { QuestionResponseDto } from './question.response.dto';
import { InterviewSettingsResponseDto } from './interview-settings.response.dto';

export class TemplateResponseDto {
  @ApiProperty({ description: 'Template UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Template title', example: 'Senior Developer Interview' })
  title: string;

  @ApiProperty({ description: 'Template description', example: 'Comprehensive interview for senior developers' })
  description: string;

  @ApiProperty({ description: 'Template status', enum: ['draft', 'active', 'archived'], example: 'active' })
  status: string;

  @ApiProperty({ description: 'User ID who created this template', example: '123e4567-e89b-12d3-a456-426614174000' })
  createdBy: string;

  @ApiProperty({ description: 'Interview settings', type: InterviewSettingsResponseDto })
  settings: InterviewSettingsResponseDto;

  @ApiProperty({ description: 'List of questions', type: [QuestionResponseDto] })
  questions: QuestionResponseDto[];

  @ApiProperty({ description: 'Total number of questions', example: 5 })
  questionsCount: number;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-11-05T22:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-11-05T22:30:00Z' })
  updatedAt: Date;
}

export class TemplateListItemDto {
  @ApiProperty({ description: 'Template UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Template title', example: 'Senior Developer Interview' })
  title: string;

  @ApiProperty({ description: 'Template description', example: 'Comprehensive interview for senior developers' })
  description: string;

  @ApiProperty({ description: 'Template status', enum: ['draft', 'active', 'archived'], example: 'active' })
  status: string;

  @ApiProperty({ description: 'User ID who created this template', example: '123e4567-e89b-12d3-a456-426614174000' })
  createdBy: string;

  @ApiProperty({ description: 'Total number of questions', example: 5 })
  questionsCount: number;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-11-05T22:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-11-05T22:30:00Z' })
  updatedAt: Date;
}

export class PaginatedTemplatesResponseDto {
  @ApiProperty({ description: 'List of templates', type: [TemplateListItemDto] })
  items: TemplateListItemDto[];

  @ApiProperty({ description: 'Total number of templates', example: 42 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;
}
