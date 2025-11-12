import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsUrl, IsInt, Min, Max } from 'class-validator';

/**
 * DTO for creating a new company
 */
export class CreateCompanyDto {
  @ApiProperty({ description: 'Company name', example: 'TechCorp Inc.' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Company industry', example: 'Software Development' })
  @IsString()
  industry: string;

  @ApiProperty({ description: 'Company size', example: '50-100 employees' })
  @IsString()
  size: string;

  @ApiPropertyOptional({ description: 'Company website URL', example: 'https://techcorp.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Company description', example: 'Leading software development company' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Company location', example: 'San Francisco, CA' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'HR user ID creating the company', example: 'uuid' })
  @IsUUID()
  createdBy: string;
}

/**
 * DTO for updating a company
 */
export class UpdateCompanyDto {
  @ApiPropertyOptional({ description: 'Company name', example: 'TechCorp Inc.' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Company industry', example: 'Software Development' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'Company size', example: '50-100 employees' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ description: 'Company website URL', example: 'https://techcorp.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Company description', example: 'Leading software development company' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Company location', example: 'San Francisco, CA' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'HR user ID updating the company', example: 'uuid' })
  @IsUUID()
  updatedBy: string;
}

/**
 * DTO for listing companies with filters
 */
export class ListCompaniesDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Search by company name', example: 'Tech' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by industry', example: 'Software Development' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'Filter by created by user ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Current user ID for filtering own companies', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  currentUserId?: string;

  @ApiPropertyOptional({ description: 'Is admin - can see all companies', example: false })
  @IsOptional()
  isAdmin?: boolean;

  @ApiPropertyOptional({ description: 'Filter by active status', example: true })
  @IsOptional()
  isActive?: boolean;
}
