import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsInt, IsEnum, IsArray, Min, Max } from 'class-validator';

/**
 * DTO for searching candidates by skills (HR)
 */
export class SearchCandidatesDto {
  @ApiPropertyOptional({ 
    description: 'Array of skill IDs to search for', 
    example: ['uuid1', 'uuid2'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  skillIds?: string[];

  @ApiPropertyOptional({ 
    description: 'Minimum proficiency level', 
    example: 'intermediate',
    enum: ['beginner', 'intermediate', 'advanced', 'expert']
  })
  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced', 'expert'])
  minProficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @ApiPropertyOptional({ 
    description: 'Minimum years of experience', 
    example: 2,
    minimum: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minYears?: number;

  @ApiPropertyOptional({ 
    description: 'Experience level', 
    example: 'mid',
    enum: ['junior', 'mid', 'senior', 'lead']
  })
  @IsOptional()
  @IsEnum(['junior', 'mid', 'senior', 'lead'])
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead';

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
}

/**
 * DTO for adding a skill to candidate profile
 */
export class AddCandidateSkillDto {
  @ApiProperty({ description: 'Skill ID to add', example: 'uuid' })
  @IsUUID()
  skillId: string;

  @ApiPropertyOptional({ 
    description: 'Skill description or notes', 
    example: 'Used in production for 2 years' 
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Proficiency level', 
    example: 'intermediate',
    enum: ['beginner', 'intermediate', 'advanced', 'expert']
  })
  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced', 'expert'])
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @ApiPropertyOptional({ 
    description: 'Years of experience with this skill', 
    example: 2,
    minimum: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;
}

/**
 * DTO for updating a candidate skill
 */
export class UpdateCandidateSkillDto {
  @ApiPropertyOptional({ 
    description: 'Skill description or notes', 
    example: 'Updated: used in 5 major projects' 
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Proficiency level', 
    example: 'advanced',
    enum: ['beginner', 'intermediate', 'advanced', 'expert']
  })
  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced', 'expert'])
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @ApiPropertyOptional({ 
    description: 'Years of experience with this skill', 
    example: 3,
    minimum: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;
}
