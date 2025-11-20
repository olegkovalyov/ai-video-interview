import { ApiProperty } from '@nestjs/swagger';

/**
 * Internal DTOs for User Service Client
 * These DTOs are used for internal API communication (not exposed via Swagger)
 */

/**
 * Create User Internal DTO
 * Used by UserServiceClient to create users in User Service
 */
export class CreateUserInternalDto {
  userId: string;
  externalAuthId: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: 'candidate' | 'hr' | 'admin' | 'pending';
}

/**
 * Update User Internal DTO
 * Used by UserServiceClient to update users in User Service
 */
export class UpdateUserInternalDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'candidate' | 'hr' | 'admin' | 'pending';
  status?: 'active' | 'suspended' | 'pending';
  lastLoginAt?: string;
}

/**
 * User Permissions Response DTO
 */
export class UserPermissionsResponseDto {
  userId: string;
  role: string;
  permissions: string[];
}

/**
 * Update Candidate Profile DTO
 */
export class UpdateCandidateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  // Candidate-specific fields
  skills?: Array<{
    skillId: string;
    proficiency: number;
    yearsOfExperience: number;
  }>;
  resume?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

/**
 * Update HR Profile DTO
 */
export class UpdateHRProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  // HR-specific fields
  companyId?: string;
  companyName?: string;
  position?: string;
  department?: string;
}
