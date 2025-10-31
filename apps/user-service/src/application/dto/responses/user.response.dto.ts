import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../../domain/aggregates/user.aggregate';

/**
 * User Response DTO
 * Maps User aggregate to API response
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

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  language: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  status: string;

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

  /**
   * Factory method to create DTO from domain model
   */
  static fromDomain(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.externalAuthId = user.externalAuthId;
    dto.email = user.email.value;
    dto.firstName = user.fullName.firstName;
    dto.lastName = user.fullName.lastName;
    dto.avatarUrl = user.avatarUrl;
    dto.bio = user.bio;
    dto.phone = user.phone;
    dto.timezone = user.timezone;
    dto.language = user.language;
    dto.emailVerified = user.emailVerified;
    dto.status = user.status.value;
    dto.isActive = user.isActive;
    dto.isSuspended = user.isSuspended;
    dto.isDeleted = user.isDeleted;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
