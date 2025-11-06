import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiPropertyOptional({
    description: 'List of candidate skills',
    type: [String],
    example: ['JavaScript', 'TypeScript', 'Node.js', 'React'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Candidate experience level',
    enum: ExperienceLevelEnum,
    example: ExperienceLevelEnum.MID,
  })
  @IsOptional()
  @IsEnum(ExperienceLevelEnum, {
    message: 'Experience level must be one of: junior, mid, senior, lead',
  })
  experienceLevel?: ExperienceLevelEnum;
}
