import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update HR Profile DTO
 * HR user updates their profile (company and position)
 */
export class UpdateHRProfileDto {
  @ApiPropertyOptional({
    description: 'Company name where HR works',
    example: 'Tech Corp Inc.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @ApiPropertyOptional({
    description: 'HR position/title',
    example: 'Senior Recruiter',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  position?: string;
}
