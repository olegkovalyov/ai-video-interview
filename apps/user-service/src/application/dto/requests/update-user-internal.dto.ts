import { IsString, IsOptional } from 'class-validator';

/**
 * DTO for updating user via internal HTTP endpoint
 * Called by API Gateway for profile updates
 */
export class UpdateUserInternalDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;
}
