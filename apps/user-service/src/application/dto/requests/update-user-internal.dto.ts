import { IsString, IsOptional } from 'class-validator';

/**
 * DTO for updating user via internal HTTP endpoint
 * Called by API Gateway during Saga orchestration
 */
export class UpdateUserInternalDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
