import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for a skill category
 */
export class SkillCategoryResponseDto {
  @ApiProperty({ example: 'uuid', description: 'Category ID' })
  id: string;

  @ApiProperty({ example: 'Frontend Development', description: 'Category name' })
  name: string;

  @ApiProperty({ example: 'frontend-development', description: 'Category slug' })
  slug: string;

  @ApiPropertyOptional({ 
    type: String,
    example: 'Technologies and frameworks for building user interfaces', 
    nullable: true,
    description: 'Category description' 
  })
  description: string | null;

  @ApiProperty({ example: true, description: 'Whether the category is active' })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;
}

/**
 * Response DTO for a single skill
 */
export class SkillResponseDto {
  @ApiProperty({ example: 'uuid', description: 'Skill ID' })
  id: string;

  @ApiProperty({ example: 'TypeScript', description: 'Skill name' })
  name: string;

  @ApiProperty({ example: 'typescript', description: 'Skill slug' })
  slug: string;

  @ApiPropertyOptional({ 
    type: String,
    example: 'JavaScript superset with static typing', 
    nullable: true,
    description: 'Skill description' 
  })
  description: string | null;

  @ApiPropertyOptional({ type: String, example: 'uuid', nullable: true, description: 'Category ID' })
  categoryId: string | null;

  @ApiPropertyOptional({ type: String, example: 'Frontend Development', nullable: true, description: 'Category name' })
  categoryName: string | null;

  @ApiProperty({ example: true, description: 'Whether the skill is active' })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;
}

/**
 * Response DTO for skill list item (lighter version)
 */
export class SkillListItemResponseDto {
  @ApiProperty({ example: 'uuid', description: 'Skill ID' })
  id: string;

  @ApiProperty({ example: 'TypeScript', description: 'Skill name' })
  name: string;

  @ApiProperty({ example: 'typescript', description: 'Skill slug' })
  slug: string;

  @ApiPropertyOptional({ type: String, example: 'uuid', nullable: true, description: 'Category ID' })
  categoryId: string | null;

  @ApiPropertyOptional({ type: String, example: 'Frontend Development', nullable: true, description: 'Category name' })
  categoryName: string | null;

  @ApiProperty({ example: true, description: 'Whether the skill is active' })
  isActive: boolean;
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
 * Response DTO for paginated skill list
 */
export class SkillListResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ 
    type: [SkillListItemResponseDto],
    description: 'List of skills' 
  })
  data: SkillListItemResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  pagination: PaginationMetaDto;
}

/**
 * Response DTO for skill categories list
 */
export class SkillCategoriesResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ 
    type: [SkillCategoryResponseDto],
    description: 'List of skill categories' 
  })
  data: SkillCategoryResponseDto[];
}

/**
 * Wrapper for single skill response
 */
export class SkillSuccessResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ type: SkillResponseDto, description: 'Skill data' })
  data: SkillResponseDto;
}
