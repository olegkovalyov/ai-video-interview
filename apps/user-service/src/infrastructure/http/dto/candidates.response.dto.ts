import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for candidate profile
 */
export class CandidateProfileResponseDto {
  @ApiProperty({ example: 'uuid', description: 'User ID' })
  userId: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  fullName: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
  email: string;

  @ApiPropertyOptional({ 
    example: 'senior', 
    nullable: true,
    enum: ['junior', 'mid', 'senior', 'lead'],
    description: 'Experience level' 
  })
  experienceLevel: string | null;

  @ApiProperty({ example: false, description: 'Whether profile is complete' })
  isProfileComplete: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Profile creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;
}

/**
 * Response DTO for a single candidate skill
 */
export class CandidateSkillResponseDto {
  @ApiProperty({ example: 'uuid', description: 'Skill ID' })
  skillId: string;

  @ApiPropertyOptional({ type: String, example: 'React', nullable: true, description: 'Skill name' })
  skillName: string | null;

  @ApiPropertyOptional({ 
    type: String,
    example: 'Building SPAs and complex UIs', 
    nullable: true,
    description: 'Personal description or notes' 
  })
  description: string | null;

  @ApiPropertyOptional({ 
    example: 'expert', 
    nullable: true,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    description: 'Proficiency level' 
  })
  proficiencyLevel: string | null;

  @ApiPropertyOptional({ 
    type: Number,
    example: 5, 
    nullable: true,
    minimum: 0,
    description: 'Years of experience' 
  })
  yearsOfExperience: number | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Date when skill was added' })
  addedAt: Date;
}

/**
 * Response DTO for skills grouped by category
 */
export class SkillsByCategoryResponseDto {
  @ApiPropertyOptional({ type: String, example: 'uuid', nullable: true, description: 'Category ID' })
  categoryId: string | null;

  @ApiPropertyOptional({ type: String, example: 'Frontend Development', nullable: true, description: 'Category name' })
  categoryName: string | null;

  @ApiProperty({ 
    type: [CandidateSkillResponseDto],
    description: 'List of skills in this category' 
  })
  skills: CandidateSkillResponseDto[];
}

/**
 * Response DTO for candidate search result (single item)
 */
export class CandidateSearchResultItemDto {
  @ApiProperty({ example: 'uuid', description: 'User ID' })
  userId: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  fullName: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
  email: string;

  @ApiPropertyOptional({ 
    example: 'senior', 
    nullable: true,
    enum: ['junior', 'mid', 'senior', 'lead'],
    description: 'Experience level' 
  })
  experienceLevel: string | null;

  @ApiProperty({ 
    type: [CandidateSkillResponseDto],
    description: 'Matched skills' 
  })
  matchedSkills: CandidateSkillResponseDto[];

  @ApiProperty({ example: 95, description: 'Match score (0-100)' })
  matchScore: number;
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
 * Response DTO for candidate search results (with pagination)
 */
export class CandidateSearchResultsResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ 
    type: [CandidateSearchResultItemDto],
    description: 'Search results' 
  })
  data: CandidateSearchResultItemDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  pagination: PaginationMetaDto;
}

/**
 * Wrapper for candidate profile response
 */
export class CandidateProfileSuccessResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ type: CandidateProfileResponseDto, description: 'Profile data' })
  data: CandidateProfileResponseDto;
}

/**
 * Wrapper for candidate skills by category response
 */
export class CandidateSkillsSuccessResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ type: [SkillsByCategoryResponseDto], description: 'Skills grouped by category' })
  data: SkillsByCategoryResponseDto[];
}
