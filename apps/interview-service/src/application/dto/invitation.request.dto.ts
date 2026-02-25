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
import { Type, Transform } from 'class-transformer';

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
  @Transform(({ value }) => value?.trim())
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
  allowPause?: boolean = true;

  @ApiPropertyOptional({ 
    description: 'Show countdown timer during interview', 
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  showTimer?: boolean = true;
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
  reason?: 'manual' | 'auto_timeout' = 'manual';
}

export class ListInvitationsQueryDto {
  @ApiPropertyOptional({ 
    description: 'Filter by invitation status', 
    enum: ['pending', 'in_progress', 'completed', 'expired'],
    example: 'pending',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by template ID (HR endpoint only)', 
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ 
    description: 'Page number (1-based)', 
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Items per page (max 100)', 
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
