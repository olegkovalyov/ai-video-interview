import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== Simple Response DTOs ====================

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

export class SuccessResponseDto {
  @ApiProperty({ 
    description: 'Operation success status', 
    example: true,
  })
  success: boolean;
}

// ==================== Question DTOs ====================

export class QuestionItemDto {
  @ApiProperty({ description: 'Question UUID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Question text', example: 'Describe your experience with React' })
  text: string;

  @ApiProperty({ description: 'Question type', enum: ['video', 'text', 'code', 'multiple_choice'] })
  type: string;

  @ApiProperty({ description: 'Question order (1-based)', example: 1 })
  order: number;

  @ApiProperty({ description: 'Time limit in seconds', example: 120 })
  timeLimit: number;

  @ApiProperty({ description: 'Is answer required?', example: true })
  required: boolean;

  @ApiPropertyOptional({ description: 'Hints for the candidate' })
  hints?: string;
}

// ==================== Response Item DTO ====================

export class ResponseItemDto {
  @ApiProperty({ description: 'Response UUID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Question ID', format: 'uuid' })
  questionId: string;

  @ApiProperty({ description: 'Question index (0-based)', example: 0 })
  questionIndex: number;

  @ApiProperty({ description: 'Question text snapshot at submission time', example: 'What is your experience?' })
  questionText: string;

  @ApiProperty({ description: 'Response type', enum: ['text', 'code', 'video'], example: 'text' })
  responseType: string;

  @ApiPropertyOptional({ description: 'Text answer (for text type)', example: 'I have 5 years of experience.' })
  textAnswer?: string;

  @ApiPropertyOptional({ description: 'Code answer (for code type)', example: 'function hello() { return "world"; }' })
  codeAnswer?: string;

  @ApiPropertyOptional({ description: 'Video URL (for video type)', example: 'https://storage.example.com/videos/abc123.webm' })
  videoUrl?: string;

  @ApiProperty({ description: 'Time spent on this question (seconds)', example: 60 })
  duration: number;

  @ApiProperty({ description: 'Submission timestamp' })
  submittedAt: Date;
}

export class InvitationProgressDto {
  @ApiProperty({ description: 'Number of answered questions', example: 2 })
  answered: number;

  @ApiProperty({ description: 'Total number of questions', example: 5 })
  total: number;

  @ApiProperty({ description: 'Progress percentage (0-100)', example: 40 })
  percentage: number;
}

export class InvitationResponseDto {
  @ApiProperty({ description: 'Invitation UUID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Interview template ID', format: 'uuid' })
  templateId: string;

  @ApiProperty({ description: 'Candidate user ID', format: 'uuid' })
  candidateId: string;

  @ApiProperty({ description: 'Company ID', format: 'uuid' })
  companyId: string;

  @ApiProperty({ description: 'HR user ID who created this invitation', format: 'uuid' })
  invitedBy: string;

  @ApiProperty({ 
    description: 'Current invitation status', 
    enum: ['pending', 'in_progress', 'completed', 'expired'],
    example: 'pending',
  })
  status: string;

  @ApiProperty({ description: 'Can candidate pause and resume the interview?', example: true })
  allowPause: boolean;

  @ApiProperty({ description: 'Show countdown timer during interview?', example: true })
  showTimer: boolean;

  @ApiProperty({ description: 'Deadline for completing the interview' })
  expiresAt: Date;

  @ApiPropertyOptional({ description: 'When candidate started the interview' })
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'When interview was completed' })
  completedAt?: Date;

  @ApiPropertyOptional({ 
    description: 'Reason for completion', 
    enum: ['manual', 'auto_timeout', 'expired'],
    example: 'manual',
  })
  completedReason?: string;

  @ApiProperty({ description: 'Interview progress information', type: InvitationProgressDto })
  progress: InvitationProgressDto;

  @ApiProperty({ description: 'List of submitted responses', type: [ResponseItemDto] })
  responses: ResponseItemDto[];

  @ApiProperty({ description: 'When invitation was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class InvitationWithTemplateDto extends InvitationResponseDto {
  @ApiProperty({ description: 'Interview template title', example: 'Frontend Developer Interview' })
  templateTitle: string;

  @ApiProperty({ description: 'Interview template description', example: 'Questions about React and TypeScript' })
  templateDescription: string;

  @ApiProperty({ description: 'List of interview questions', type: [QuestionItemDto] })
  questions: QuestionItemDto[];
}

export class InvitationListItemDto {
  @ApiProperty({ description: 'Invitation UUID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Template ID', format: 'uuid' })
  templateId: string;

  @ApiProperty({ description: 'Interview template title', example: 'Frontend Developer Interview' })
  templateTitle: string;

  @ApiProperty({ description: 'Candidate user ID', format: 'uuid' })
  candidateId: string;

  @ApiPropertyOptional({ description: 'Candidate full name', example: 'John Doe' })
  candidateName?: string;

  @ApiPropertyOptional({ description: 'Candidate email', example: 'john.doe@example.com' })
  candidateEmail?: string;

  @ApiProperty({ description: 'Company ID', format: 'uuid' })
  companyId: string;

  @ApiPropertyOptional({ description: 'Company name', example: 'Acme Corp' })
  companyName?: string;

  @ApiProperty({ 
    description: 'Current invitation status', 
    enum: ['pending', 'in_progress', 'completed', 'expired'],
    example: 'pending',
  })
  status: string;

  @ApiProperty({ description: 'Can candidate pause the interview?', example: true })
  allowPause: boolean;

  @ApiProperty({ description: 'Deadline for completing the interview' })
  expiresAt: Date;

  @ApiProperty({ description: 'Interview progress', type: InvitationProgressDto })
  progress: InvitationProgressDto;

  @ApiProperty({ description: 'When invitation was created' })
  createdAt: Date;
}

export class PaginatedInvitationsResponseDto {
  @ApiProperty({ description: 'List of invitations', type: [InvitationListItemDto] })
  items: InvitationListItemDto[];

  @ApiProperty({ description: 'Total number of matching invitations', example: 25 })
  total: number;

  @ApiProperty({ description: 'Current page number (1-based)', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 3 })
  totalPages: number;
}
