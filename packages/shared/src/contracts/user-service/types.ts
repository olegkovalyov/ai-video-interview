/**
 * User Service API Types
 * 
 * Clean type exports from generated OpenAPI types.
 * This file provides simple, direct imports without nested path access.
 * 
 * Generated from: http://localhost:8002/api/docs-json
 * 
 * Usage:
 *   import { UserResponseDto, UpdateUserDto } from '@shared';
 */

import type { components } from './user-service.generated';

// ============================================================================
// User DTOs
// ============================================================================

/**
 * User response with full details
 */
export type UserResponseDto = components['schemas']['UserResponseDto'];

/**
 * Update user profile
 */
export type UpdateUserDto = components['schemas']['UpdateUserDto'];

/**
 * Suspend user with reason
 */
export type SuspendUserDto = components['schemas']['SuspendUserDto'];

// ============================================================================
// Pagination & Lists
// ============================================================================

/**
 * Pagination metadata
 */
export type PaginationDto = components['schemas']['PaginationDto'];

/**
 * Paginated user list response
 */
export type UserListResponseDto = components['schemas']['UserListResponseDto'];

// ============================================================================
// Roles & Permissions
// ============================================================================

/**
 * Role information
 */
export type RoleInfoDto = components['schemas']['RoleInfoDto'];

/**
 * User permissions response
 */
export type UserPermissionsResponseDto = components['schemas']['UserPermissionsResponseDto'];

// ============================================================================
// Enums & Union Types
// ============================================================================

/**
 * User status enum
 */
export type UserStatus = 'active' | 'suspended' | 'deleted';

/**
 * User role enum
 */
export type UserRole = 'candidate' | 'hr' | 'admin';
