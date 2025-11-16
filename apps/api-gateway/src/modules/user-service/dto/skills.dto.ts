import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Skills DTOs for API Gateway
 * Based on user-service OpenAPI specification
 */

// ============================================================================
// ADMIN SKILLS DTOs
// ============================================================================

/**
 * DTO for creating a new skill (Admin)
 * POST /api/admin/skills
 */
export class CreateSkillDto {
  @ApiProperty({
    description: 'Skill name',
    example: 'TypeScript',
    minLength: 1,
    maxLength: 100,
  })
  name: string;

  @ApiProperty({
    description: 'Skill slug (URL-friendly)',
    example: 'typescript',
    minLength: 1,
    maxLength: 100,
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Skill category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Skill description',
    example: 'JavaScript superset with static typing',
    maxLength: 500,
  })
  description?: string;
}

/**
 * DTO for updating a skill (Admin)
 * PUT /api/admin/skills/:id
 */
export class UpdateSkillDto {
  @ApiPropertyOptional({
    description: 'Skill name',
    example: 'TypeScript',
    minLength: 1,
    maxLength: 100,
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Skill description',
    example: 'JavaScript superset with static typing',
    maxLength: 500,
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Skill category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  categoryId?: string;
}

/**
 * Skill response DTO
 */
export class SkillDto {
  @ApiProperty({
    description: 'Skill ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Skill name',
    example: 'TypeScript',
  })
  name: string;

  @ApiProperty({
    description: 'Skill slug',
    example: 'typescript',
  })
  slug: string;

  @ApiProperty({
    description: 'Skill category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  categoryId: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Frontend',
  })
  categoryName: string;

  @ApiPropertyOptional({
    description: 'Skill description',
    example: 'JavaScript superset with static typing',
  })
  description?: string;

  @ApiProperty({
    description: 'Whether skill is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Number of candidates with this skill',
    example: 42,
  })
  candidatesCount: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-11-15T10:00:00Z',
    format: 'date-time',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-11-15T10:00:00Z',
    format: 'date-time',
  })
  updatedAt: string;
}

/**
 * Paginated skills list response
 * GET /api/admin/skills
 */
export class SkillsListResponseDto {
  @ApiProperty({
    description: 'List of skills',
    type: [SkillDto],
  })
  data: SkillDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 100,
      page: 1,
      limit: 20,
      totalPages: 5,
    },
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Skill category DTO
 */
export class SkillCategoryDto {
  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Frontend',
  })
  name: string;

  @ApiProperty({
    description: 'Category slug',
    example: 'frontend',
  })
  slug: string;

  @ApiProperty({
    description: 'Number of skills in category',
    example: 12,
  })
  skillsCount: number;
}

// ============================================================================
// CANDIDATE SKILLS DTOs
// ============================================================================

/**
 * Proficiency level enum
 */
export enum ProficiencyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

/**
 * DTO for adding a skill to candidate profile
 * POST /api/me/skills
 */
export class AddCandidateSkillDto {
  @ApiProperty({
    description: 'Skill ID to add',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  skillId: string;

  @ApiPropertyOptional({
    description: 'Skill description or notes',
    example: 'Used in production for 2 years',
    maxLength: 500,
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Proficiency level',
    enum: ProficiencyLevel,
    example: ProficiencyLevel.INTERMEDIATE,
  })
  proficiencyLevel?: ProficiencyLevel;

  @ApiPropertyOptional({
    description: 'Years of experience with this skill',
    example: 2,
    minimum: 0,
    maximum: 50,
  })
  yearsOfExperience?: number;
}

/**
 * DTO for updating candidate skill
 * PUT /api/me/skills/:skillId
 */
export class UpdateCandidateSkillDto {
  @ApiPropertyOptional({
    description: 'Skill description or notes',
    example: 'Used in production for 2 years',
    maxLength: 500,
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Proficiency level',
    enum: ProficiencyLevel,
    example: ProficiencyLevel.ADVANCED,
  })
  proficiencyLevel?: ProficiencyLevel;

  @ApiPropertyOptional({
    description: 'Years of experience with this skill',
    example: 3,
    minimum: 0,
    maximum: 50,
  })
  yearsOfExperience?: number;
}

/**
 * Candidate skill response DTO
 */
export class CandidateSkillDto {
  @ApiProperty({
    description: 'Skill ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  skillId: string;

  @ApiProperty({
    description: 'Skill name',
    example: 'React',
  })
  skillName: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Frontend',
  })
  categoryName: string;

  @ApiPropertyOptional({
    description: 'Skill description or notes',
    example: 'Built 10+ production React apps',
  })
  description?: string;

  @ApiProperty({
    description: 'Proficiency level',
    enum: ProficiencyLevel,
    example: ProficiencyLevel.EXPERT,
  })
  proficiencyLevel: ProficiencyLevel;

  @ApiProperty({
    description: 'Years of experience',
    example: 5,
  })
  yearsOfExperience: number;

  @ApiProperty({
    description: 'When skill was added to profile',
    example: '2024-01-15T10:00:00Z',
    format: 'date-time',
  })
  addedAt: string;
}

/**
 * Candidate skills grouped by category
 */
export class CandidateSkillsByCategoryDto {
  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  categoryId: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Frontend',
  })
  categoryName: string;

  @ApiProperty({
    description: 'Skills in this category',
    type: [CandidateSkillDto],
  })
  skills: CandidateSkillDto[];
}

/**
 * Success response for delete operations
 */
export class SkillDeleteResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Skill deleted successfully',
  })
  message: string;
}
