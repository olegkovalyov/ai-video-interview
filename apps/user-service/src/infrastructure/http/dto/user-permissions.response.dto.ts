import { ApiProperty } from '@nestjs/swagger';

/**
 * Role DTO
 */
export class RoleDto {
  @ApiProperty({ description: 'Role ID', example: 'candidate' })
  id: string;

  @ApiProperty({ description: 'Role name', example: 'candidate' })
  name: string;

  @ApiProperty({ description: 'Role display name', example: 'Candidate' })
  displayName: string;
}

/**
 * User Permissions Response DTO
 */
export class UserPermissionsResponseDto {
  @ApiProperty({ description: 'User ID', example: 'uuid' })
  userId: string;

  @ApiProperty({ 
    description: 'User roles', 
    type: [RoleDto],
    example: [{ id: 'candidate', name: 'candidate', displayName: 'Candidate' }]
  })
  roles: RoleDto[];

  @ApiProperty({ 
    description: 'User permissions', 
    example: ['read:own_profile', 'write:own_profile'],
    type: [String]
  })
  permissions: string[];
}

/**
 * Success wrapper for user permissions
 */
export class UserPermissionsSuccessResponseDto {
  @ApiProperty({ description: 'Success flag', example: true })
  success: boolean;

  @ApiProperty({ description: 'User permissions data', type: UserPermissionsResponseDto })
  data: UserPermissionsResponseDto;
}
