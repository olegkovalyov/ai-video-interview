import { IsString } from 'class-validator';

/**
 * DTO for assigning role via internal HTTP endpoint
 * Called by API Gateway during Saga orchestration
 */
export class AssignRoleInternalDto {
  @IsString()
  roleName: string;
}
