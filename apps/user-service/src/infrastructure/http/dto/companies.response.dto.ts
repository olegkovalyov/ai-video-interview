import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for a single company
 */
export class CompanyResponseDto {
  @ApiProperty({ example: 'uuid', description: 'Company ID' })
  id: string;

  @ApiProperty({ example: 'TechCorp Inc.', description: 'Company name' })
  name: string;

  @ApiPropertyOptional({ 
    type: String,
    example: 'Leading software development company', 
    nullable: true,
    description: 'Company description' 
  })
  description: string | null;

  @ApiPropertyOptional({ 
    type: String,
    example: 'https://techcorp.com', 
    nullable: true,
    description: 'Company website URL' 
  })
  website: string | null;

  @ApiPropertyOptional({ 
    type: String,
    example: 'https://cdn.example.com/logo.png', 
    nullable: true,
    description: 'Company logo URL' 
  })
  logoUrl: string | null;

  @ApiPropertyOptional({ 
    type: String,
    example: 'Software Development', 
    nullable: true,
    description: 'Company industry' 
  })
  industry: string | null;

  @ApiPropertyOptional({ 
    type: String,
    example: '50-100 employees', 
    nullable: true,
    description: 'Company size' 
  })
  size: string | null;

  @ApiPropertyOptional({ 
    type: String,
    example: 'San Francisco, CA', 
    nullable: true,
    description: 'Company location' 
  })
  location: string | null;

  @ApiPropertyOptional({ 
    type: String,
    example: 'Senior Software Engineer', 
    nullable: true,
    description: 'HR position in the company' 
  })
  position: string | null;

  @ApiProperty({ example: 'uuid', description: 'HR user ID who created the company' })
  createdBy: string;

  @ApiProperty({ example: true, description: 'Whether the company is active' })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;
}

/**
 * Response DTO for company list item (lighter version)
 */
export class CompanyListItemResponseDto {
  @ApiProperty({ example: 'uuid', description: 'Company ID' })
  id: string;

  @ApiProperty({ example: 'TechCorp Inc.', description: 'Company name' })
  name: string;

  @ApiPropertyOptional({ 
    type: String,
    example: 'Software Development', 
    nullable: true,
    description: 'Company industry' 
  })
  industry: string | null;

  @ApiPropertyOptional({ 
    type: String,
    example: '50-100 employees', 
    nullable: true,
    description: 'Company size' 
  })
  size: string | null;

  @ApiPropertyOptional({ 
    type: String,
    example: 'San Francisco, CA', 
    nullable: true,
    description: 'Company location' 
  })
  location: string | null;

  @ApiProperty({ example: true, description: 'Whether the company is active' })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;
}

/**
 * Pagination metadata
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 42, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 20, description: 'Items per page' })
  limit: number;

  @ApiProperty({ example: 3, description: 'Total number of pages' })
  totalPages: number;
}

/**
 * Response DTO for paginated company list
 */
export class CompanyListResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ 
    type: [CompanyListItemResponseDto],
    description: 'List of companies' 
  })
  data: CompanyListItemResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  pagination: PaginationMetaDto;
}

/**
 * Wrapper for single company response
 */
export class CompanySuccessResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ type: CompanyResponseDto, description: 'Company data' })
  data: CompanyResponseDto;
}
