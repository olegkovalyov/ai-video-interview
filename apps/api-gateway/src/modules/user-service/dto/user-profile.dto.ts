import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating user profile (PUT /api/users/me)
 */
export class UpdateProfileDto {
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
    description: 'Full name',
    example: 'John Doe',
    required: false,
  })
  fullName?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Bio/description',
    example: 'Software Engineer with 5 years of experience',
    required: false,
  })
  bio?: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatarUrl?: string;
}

/**
 * DTO for role selection (POST /api/users/me/select-role)
 */
export class SelectRoleDto {
  @ApiProperty({
    description: 'Role to assign',
    enum: ['candidate', 'hr', 'admin'],
    example: 'candidate',
  })
  role: 'candidate' | 'hr' | 'admin';
}

/**
 * User profile response
 */
export class UserProfileResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ enum: ['candidate', 'hr', 'admin', 'pending'], example: 'candidate' })
  role: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  lastLoginAt?: string;
}
