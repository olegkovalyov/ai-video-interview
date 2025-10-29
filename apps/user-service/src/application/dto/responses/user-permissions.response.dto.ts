import { ApiProperty } from '@nestjs/swagger';

/**
 * Role Info DTO
 */
export class RoleInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  displayName: string;
}

/**
 * User Permissions Response DTO
 */
export class UserPermissionsResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ type: () => [RoleInfoDto] })
  roles: RoleInfoDto[];

  @ApiProperty({ type: () => [String] })
  permissions: string[];
}
