import { IsString, IsOptional, IsUUID, MaxLength, MinLength } from 'class-validator';

/**
 * DTO for creating a skill
 */
export class CreateSkillDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  slug: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
