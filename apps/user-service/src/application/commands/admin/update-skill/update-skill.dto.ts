import { IsString, IsOptional, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateSkillDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
