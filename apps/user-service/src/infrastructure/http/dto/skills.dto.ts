import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';

/**
 * DTO for creating a new skill
 */
export class CreateSkillDto {
  @ApiProperty({ description: 'Skill name', example: 'TypeScript' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Skill slug (URL-friendly)', example: 'typescript' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ description: 'Skill category ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Skill description', example: 'JavaScript superset with static typing' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Admin ID performing the action', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  adminId?: string;
}

/**
 * DTO for updating a skill
 */
export class UpdateSkillDto {
  @ApiPropertyOptional({ description: 'Skill name', example: 'TypeScript' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Skill description', example: 'JavaScript superset with static typing' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Skill category ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Admin ID performing the action', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  adminId?: string;
}

/**
 * DTO for listing skills with filters
 */
export class ListSkillsDto {
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

  @ApiPropertyOptional({ description: 'Search by skill name', example: 'Type' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
