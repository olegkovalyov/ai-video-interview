import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Update HR Profile DTO
 * HR user updates their profile (company and position)
 */
export class UpdateHRProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  position?: string;
}
