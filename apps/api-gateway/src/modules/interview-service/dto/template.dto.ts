import { ApiProperty } from '@nestjs/swagger';
import { InterviewSettingsDto, InterviewSettingsResponseDto } from './settings.dto';
import { QuestionResponseDto } from './question.dto';

/**
 * Create Template DTO
 * Creates a new interview template
 */
export class CreateTemplateDto {
  @ApiProperty({
    description: 'Interview template title',
    example: 'Senior Developer Interview',
    minLength: 1,
    maxLength: 200,
  })
  title: string;

  @ApiProperty({
    description: 'Detailed description of the interview template',
    example: 'Comprehensive interview for senior backend developers with focus on system design and architecture',
    minLength: 1,
    maxLength: 1000,
  })
  description: string;

  @ApiProperty({
    description: 'Interview settings (optional)',
    type: InterviewSettingsDto,
    required: false,
  })
  settings?: InterviewSettingsDto;
}

/**
 * Update Template DTO
 * Updates template metadata
 */
export class UpdateTemplateDto {
  @ApiProperty({
    description: 'Updated interview template title',
    example: 'Senior Full-Stack Developer Interview',
    maxLength: 200,
    required: false,
  })
  title?: string;

  @ApiProperty({
    description: 'Updated detailed description',
    example: 'Updated comprehensive interview for senior full-stack developers',
    maxLength: 1000,
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Updated interview settings',
    type: InterviewSettingsDto,
    required: false,
  })
  settings?: InterviewSettingsDto;
}

/**
 * Template List Item DTO
 * Used in paginated list responses
 */
export class TemplateListItemDto {
  @ApiProperty({
    description: 'Template UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Template title',
    example: 'Senior Developer Interview',
  })
  title: string;

  @ApiProperty({
    description: 'Template description',
    example: 'Comprehensive interview for senior developers',
  })
  description: string;

  @ApiProperty({
    description: 'Template status',
    enum: ['draft', 'active', 'archived'],
    example: 'active',
  })
  status: 'draft' | 'active' | 'archived';

  @ApiProperty({
    description: 'User ID who created this template',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Total number of questions',
    example: 5,
  })
  questionsCount: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-11-05T22:00:00Z',
    type: String,
    format: 'date-time',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-11-05T22:30:00Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: string;
}

/**
 * Template Response DTO
 * Full template with all questions
 */
export class TemplateResponseDto {
  @ApiProperty({
    description: 'Template UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Template title',
    example: 'Senior Developer Interview',
  })
  title: string;

  @ApiProperty({
    description: 'Template description',
    example: 'Comprehensive interview for senior developers',
  })
  description: string;

  @ApiProperty({
    description: 'Template status',
    enum: ['draft', 'active', 'archived'],
    example: 'active',
  })
  status: 'draft' | 'active' | 'archived';

  @ApiProperty({
    description: 'User ID who created this template',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Interview settings',
    type: InterviewSettingsResponseDto,
  })
  settings: InterviewSettingsResponseDto;

  @ApiProperty({
    description: 'List of questions',
    type: [QuestionResponseDto],
  })
  questions: QuestionResponseDto[];

  @ApiProperty({
    description: 'Total number of questions',
    example: 5,
  })
  questionsCount: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-11-05T22:00:00Z',
    type: String,
    format: 'date-time',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-11-05T22:30:00Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: string;
}

/**
 * Paginated Templates Response DTO
 */
export class PaginatedTemplatesResponseDto {
  @ApiProperty({
    description: 'List of templates',
    type: [TemplateListItemDto],
  })
  items: TemplateListItemDto[];

  @ApiProperty({
    description: 'Total number of templates',
    example: 42,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;
}

/**
 * Create Template Response DTO
 */
export class CreateTemplateResponseDto {
  @ApiProperty({
    description: 'Created template ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;
}

/**
 * Publish Template Response DTO
 */
export class PublishTemplateResponseDto {
  @ApiProperty({
    description: 'Template status after publishing',
    enum: ['active'],
    example: 'active',
  })
  status: 'active';
}
