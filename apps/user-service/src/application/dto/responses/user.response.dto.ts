import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { UserReadModel } from '../../../domain/read-models/user.read-model';

/**
 * User Response DTO
 * Maps User Read Model to API response
 */
export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  externalAuthId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  avatarUrl: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  bio: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  phone: string | null;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  language: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  status: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isSuspended: boolean;

  @ApiProperty()
  isDeleted: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: Date, nullable: true })
  lastLoginAt: Date | null;

  /**
   * Factory method to create DTO from Read Model
   */
  static fromDomain(user: UserReadModel): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.externalAuthId = user.externalAuthId;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.avatarUrl = user.avatarUrl;
    dto.bio = user.bio;
    dto.phone = user.phone;
    dto.timezone = user.timezone;
    dto.language = user.language;
    dto.emailVerified = user.emailVerified;
    dto.status = user.status;
    dto.role = user.role;
    dto.isActive = user.status === 'active';
    dto.isSuspended = user.status === 'suspended';
    dto.isDeleted = user.status === 'deleted';
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    dto.lastLoginAt = user.lastLoginAt;
    return dto;
  }
}
