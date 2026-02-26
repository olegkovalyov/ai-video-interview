import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// ════════════════════════════════════════════════════════════════
// Request DTOs
// ════════════════════════════════════════════════════════════════

export class CreateInvitationDto {
  @ApiProperty({
    description: 'Interview template ID (must be active/published)',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  templateId: string;

  @ApiProperty({
    description: 'Candidate user ID who will take the interview',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  candidateId: string;

  @ApiProperty({
    description: 'Company name',
    example: 'TechCorp Inc.',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({
    description: 'Deadline for completing the interview (ISO 8601 format)',
    example: '2025-01-15T23:59:59Z',
  })
  @IsDateString()
  expiresAt: string;

  @ApiPropertyOptional({
    description: 'Allow candidate to pause and resume the interview',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  allowPause?: boolean;

  @ApiPropertyOptional({
    description: 'Show countdown timer during interview',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  showTimer?: boolean;
}

export class SubmitResponseDto {
  @ApiProperty({
    description: 'Question ID being answered',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsUUID()
  questionId: string;

  @ApiProperty({
    description: 'Question index (0-based)',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  questionIndex: number;

  @ApiProperty({
    description: 'Question text snapshot (for record keeping)',
    example: 'What is your experience with React?',
  })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({
    description: 'Type of response being submitted',
    enum: ['text', 'code', 'video'],
    example: 'text',
  })
  @IsEnum(['text', 'code', 'video'])
  responseType: 'text' | 'code' | 'video';

  @ApiProperty({
    description: 'Time spent on this question (seconds)',
    example: 60,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  duration: number;

  @ApiPropertyOptional({
    description: 'Text answer (required when responseType is "text")',
    example: 'I have 5 years of experience with React...',
  })
  @IsOptional()
  @IsString()
  textAnswer?: string;

  @ApiPropertyOptional({
    description: 'Code answer (required when responseType is "code")',
    example: 'function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }',
  })
  @IsOptional()
  @IsString()
  codeAnswer?: string;

  @ApiPropertyOptional({
    description: 'Video URL (required when responseType is "video")',
    example: 'https://storage.example.com/videos/response-abc123.webm',
  })
  @IsOptional()
  @IsString()
  videoUrl?: string;
}

export class CompleteInvitationDto {
  @ApiPropertyOptional({
    description: 'Reason for completing the interview',
    enum: ['manual', 'auto_timeout'],
    default: 'manual',
    example: 'manual',
  })
  @IsOptional()
  @IsEnum(['manual', 'auto_timeout'])
  reason?: 'manual' | 'auto_timeout';
}

// ════════════════════════════════════════════════════════════════
// Response DTOs
// ════════════════════════════════════════════════════════════════

export class CreateInvitationResponseDto {
  @ApiProperty({
    description: 'Created invitation UUID',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;
}

export class SubmitResponseResponseDto {
  @ApiProperty({
    description: 'Created response UUID',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id: string;
}

export class InvitationProgressDto {
  @ApiProperty({ description: 'Number of answered questions', example: 2 })
  answered: number;

  @ApiProperty({ description: 'Total number of questions', example: 5 })
  total: number;

  @ApiProperty({ description: 'Progress percentage (0-100)', example: 40 })
  percentage: number;
}

export class ResponseItemDto {
  @ApiProperty({ description: 'Response UUID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Question ID', format: 'uuid' })
  questionId: string;

  @ApiProperty({ description: 'Question index (0-based)', example: 0 })
  questionIndex: number;

  @ApiProperty({ description: 'Question text snapshot', example: 'What is your experience?' })
  questionText: string;

  @ApiProperty({ description: 'Response type', enum: ['text', 'code', 'video'], example: 'text' })
  responseType: string;

  @ApiPropertyOptional({ description: 'Text answer' })
  textAnswer?: string;

  @ApiPropertyOptional({ description: 'Code answer' })
  codeAnswer?: string;

  @ApiPropertyOptional({ description: 'Video URL' })
  videoUrl?: string;

  @ApiProperty({ description: 'Time spent (seconds)', example: 60 })
  duration: number;

  @ApiProperty({ description: 'Submission timestamp' })
  submittedAt: Date;
}

export class InvitationResponseDto {
  @ApiProperty({ description: 'Invitation UUID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Template ID', format: 'uuid' })
  templateId: string;

  @ApiProperty({ description: 'Candidate user ID', format: 'uuid' })
  candidateId: string;

  @ApiProperty({ description: 'Company name', example: 'TechCorp Inc.' })
  companyName: string;

  @ApiProperty({ description: 'HR user ID who created invitation', format: 'uuid' })
  invitedBy: string;

  @ApiProperty({
    description: 'Current invitation status',
    enum: ['pending', 'in_progress', 'completed', 'expired'],
    example: 'pending',
  })
  status: string;

  @ApiProperty({ description: 'Can candidate pause?', example: true })
  allowPause: boolean;

  @ApiProperty({ description: 'Show timer?', example: true })
  showTimer: boolean;

  @ApiProperty({ description: 'Deadline' })
  expiresAt: Date;

  @ApiPropertyOptional({ description: 'When started' })
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'When completed' })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Completion reason',
    enum: ['manual', 'auto_timeout', 'expired'],
  })
  completedReason?: string;

  @ApiProperty({ description: 'Progress', type: InvitationProgressDto })
  progress: InvitationProgressDto;

  @ApiProperty({ description: 'Responses', type: [ResponseItemDto] })
  responses: ResponseItemDto[];

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class InvitationWithTemplateDto extends InvitationResponseDto {
  @ApiProperty({ description: 'Template title', example: 'Frontend Developer Interview' })
  templateTitle: string;

  @ApiProperty({ description: 'Template description' })
  templateDescription: string;

  @ApiProperty({ description: 'Questions' })
  questions: Array<{
    id: string;
    text: string;
    type: string;
    order: number;
    timeLimit: number;
    required: boolean;
  }>;
}

export class InvitationListItemDto {
  @ApiProperty({ description: 'Invitation UUID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Template ID', format: 'uuid' })
  templateId: string;

  @ApiProperty({ description: 'Template title', example: 'Frontend Developer Interview' })
  templateTitle: string;

  @ApiProperty({ description: 'Candidate ID', format: 'uuid' })
  candidateId: string;

  @ApiPropertyOptional({ description: 'Candidate name' })
  candidateName?: string;

  @ApiPropertyOptional({ description: 'Candidate email' })
  candidateEmail?: string;

  @ApiProperty({ description: 'Company name', example: 'TechCorp Inc.' })
  companyName: string;

  @ApiProperty({
    description: 'Status',
    enum: ['pending', 'in_progress', 'completed', 'expired'],
    example: 'pending',
  })
  status: string;

  @ApiProperty({ description: 'Can pause?', example: true })
  allowPause: boolean;

  @ApiProperty({ description: 'Deadline' })
  expiresAt: Date;

  @ApiProperty({ description: 'Progress', type: InvitationProgressDto })
  progress: InvitationProgressDto;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}

export class PaginatedInvitationsResponseDto {
  @ApiProperty({ description: 'List of invitations', type: [InvitationListItemDto] })
  items: InvitationListItemDto[];

  @ApiProperty({ description: 'Total count', example: 25 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 3 })
  totalPages: number;
}
