import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

/**
 * DTO for updating user profile (PUT /api/users/me)
 */
export class UpdateProfileDto {
  @ApiProperty({ description: 'First name', example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'Last name', example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Bio/description',
    example: 'Software Engineer',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: 'Timezone',
    example: 'Europe/Kiev',
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ description: 'Language', example: 'en', required: false })
  @IsOptional()
  @IsString()
  language?: string;
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
  @IsString()
  @IsIn(['candidate', 'hr', 'admin'])
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

  @ApiProperty({
    enum: ['candidate', 'hr', 'admin', 'pending'],
    example: 'candidate',
  })
  role: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  lastLoginAt?: string;
}
