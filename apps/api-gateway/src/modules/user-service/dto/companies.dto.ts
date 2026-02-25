import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength, IsUrl } from 'class-validator';

// ============================================================================
// REQUEST DTOs
// ============================================================================

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Company name',
    example: 'TechCorp Inc.',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Industry',
    example: 'Software Development',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  industry: string;

  @ApiProperty({
    description: 'Company size',
    example: '50-100 employees',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  size: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://techcorp.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Company description',
    example: 'Leading software development company',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Company location',
    example: 'San Francisco, CA',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({
    description: 'Company name',
    example: 'TechCorp Inc.',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Industry',
    example: 'Software Development',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({
    description: 'Company size',
    example: '50-100 employees',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  size?: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://techcorp.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Company description',
    example: 'Leading software development company',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Company location',
    example: 'San Francisco, CA',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({
    description: 'Is company active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class CompanyResponseDto {
  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Company name',
    example: 'TechCorp Inc.',
  })
  name: string;

  @ApiProperty({
    description: 'Industry',
    example: 'Software Development',
  })
  industry: string;

  @ApiProperty({
    description: 'Company size',
    example: '50-100 employees',
  })
  size: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://techcorp.com',
  })
  website?: string;

  @ApiPropertyOptional({
    description: 'Company description',
    example: 'Leading software development company',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Company location',
    example: 'San Francisco, CA',
  })
  location?: string;

  @ApiProperty({
    description: 'Is company active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'User ID who created this company',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: string;
}

export class CompaniesListResponseDto {
  @ApiProperty({
    description: 'List of companies',
    type: [CompanyResponseDto],
  })
  data: CompanyResponseDto[];

  @ApiProperty({
    description: 'Pagination info',
    example: { total: 100, page: 1, limit: 20, totalPages: 5 },
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class CompanyDeleteResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Company deleted successfully',
  })
  message: string;
}

// ============================================================================
// QUERY FILTERS
// ============================================================================

export interface CompanyFilters {
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
  isActive?: boolean;
}
