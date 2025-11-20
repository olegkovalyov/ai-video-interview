import { IsString, IsOptional, IsUUID, IsEnum, IsInt, Min, Max, MaxLength } from 'class-validator';

export class AddCandidateSkillDto {
  @IsUUID()
  skillId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(['beginner', 'intermediate', 'advanced', 'expert'])
  proficiencyLevel: string;

  @IsInt()
  @Min(0)
  @Max(50)
  yearsOfExperience: number;
}
