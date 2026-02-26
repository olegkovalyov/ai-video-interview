import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating user (POST /api/admin/users)
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Username for login (optional, defaults to email)',
    example: 'johndoe',
    required: false,
  })
  username?: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Password (optional, default: "password")',
    example: 'SecurePassword123',
    required: false,
  })
  password?: string;
}

/**
 * DTO for updating user (PUT /api/admin/users/:id)
 */
export class UpdateUserDto {
  @ApiProperty({
    description: 'First name',
    example: 'John',
    required: false,
  })
  firstName?: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    required: false,
  })
  lastName?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'Enable/disable user account',
    example: true,
    required: false,
  })
  enabled?: boolean;
}

/**
 * DTO for suspend user (POST /api/admin/users/:id/suspend)
 */
export class SuspendUserDto {
  @ApiProperty({
    description: 'Reason for suspension',
    example: 'Policy violation',
  })
  reason: string;
}

/**
 * DTO for assign role (POST /api/admin/users/:id/roles)
 */
export class AssignRoleDto {
  @ApiProperty({
    description: 'Role name to assign',
    enum: ['candidate', 'hr', 'admin', 'pending'],
    example: 'candidate',
  })
  roleName: string;
}

/**
 * User response DTO
 */
export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiProperty({ example: true })
  emailVerified: boolean;

  @ApiProperty({ 
    description: 'User roles',
    example: ['candidate'],
    type: [String]
  })
  realmRoles?: string[];

  @ApiProperty({ 
    example: '2024-01-01T00:00:00.000Z',
    required: false 
  })
  createdTimestamp?: number;

  @ApiProperty({ 
    example: '2024-01-01T00:00:00.000Z',
    required: false 
  })
  lastLoginAt?: string;
}

/**
 * User list response
 */
export class UserListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    type: [UserResponseDto],
    description: 'List of users',
  })
  data: UserResponseDto[];

  @ApiProperty({ example: 10 })
  count: number;
}

/**
 * User statistics response
 */
export class UserStatsResponseDto {
  @ApiProperty({
    description: 'Total number of users',
    example: 100,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Number of active users',
    example: 80,
  })
  activeUsers: number;

  @ApiProperty({
    description: 'Number of suspended users',
    example: 10,
  })
  suspendedUsers: number;

  @ApiProperty({
    description: 'Number of deleted users',
    example: 10,
  })
  deletedUsers: number;

  @ApiProperty({
    description: 'Users grouped by status',
    example: {
      active: 80,
      suspended: 10,
      deleted: 10,
    },
  })
  usersByStatus: Record<string, number>;
}

/**
 * Create user response
 */
export class CreateUserResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    description: 'Created user data',
    example: {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      keycloakId: '456e7890-a12b-34c5-d678-901234567890',
      email: 'john.doe@example.com',
    },
  })
  data: {
    userId: string;
    keycloakId: string;
    email: string;
  };
}

/**
 * Role response DTO
 */
export class RoleDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'candidate' })
  name: string;

  @ApiProperty({ example: 'Candidate role', required: false })
  description?: string;
}

/**
 * Roles list response
 */
export class RolesListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    type: [RoleDto],
    description: 'List of available roles',
  })
  data: RoleDto[];
}

/**
 * User roles response
 */
export class UserRolesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    type: [RoleDto],
    description: 'List of user roles',
  })
  data: RoleDto[];
}
