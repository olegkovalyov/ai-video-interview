import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export enum ExperienceLevelEnum {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
}

/**
 * Update Candidate Profile DTO
 * Candidate updates their profile (skills and experience)
 */
export class UpdateCandidateProfileDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsEnum(ExperienceLevelEnum, {
    message: 'Experience level must be one of: junior, mid, senior, lead',
  })
  experienceLevel?: ExperienceLevelEnum;
}
