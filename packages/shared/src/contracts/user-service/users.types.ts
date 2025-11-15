/**
 * Users, UserAdmin, and UserProfiles types
 * Includes all user management operations
 */

import type { PaginationDto } from './common.types';

// ==================== SCHEMAS ====================

export interface SuspendUserDto {
  /** @example Policy violation: spam */
  reason: string;
}

export interface UserResponseDto {
  id: string;
  externalAuthId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  timezone: string;
  language: string;
  emailVerified: boolean;
  status: string;
  role: string;
  isActive: boolean;
  isSuspended: boolean;
  isDeleted: boolean;
  /** Format: date-time */
  createdAt: string;
  /** Format: date-time */
  updatedAt: string;
  /** Format: date-time */
  lastLoginAt?: string;
}

export interface UserListResponseDto {
  data: UserResponseDto[];
  pagination: PaginationDto;
}

export interface UserStatsResponseDto {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  deletedUsers: number;
  usersByStatus: Record<string, never>;
}

export interface CreateUserInternalDto {
  /**
   * @description Internal user ID (UUID)
   * @example 550e8400-e29b-41d4-a716-446655440000
   */
  userId: string;
  /**
   * @description External authentication provider ID (e.g., Keycloak sub)
   * @example auth0|507f1f77bcf86cd799439011
   */
  externalAuthId: string;
  /**
   * @description User email address
   * @example john.doe@example.com
   */
  email: string;
  /**
   * @description User first name
   * @example John
   */
  firstName: string;
  /**
   * @description User last name
   * @example Doe
   */
  lastName: string;
}

export interface UpdateUserInternalDto {
  /**
   * @description User first name
   * @example John
   */
  firstName?: string;
  /**
   * @description User last name
   * @example Doe
   */
  lastName?: string;
  /**
   * @description User biography
   * @example Experienced software engineer with 5+ years in backend development
   */
  bio?: string;
  /**
   * @description User phone number
   * @example +1234567890
   */
  phone?: string;
  /**
   * @description User timezone
   * @example Europe/Kiev
   */
  timezone?: string;
  /**
   * @description Preferred language code
   * @example en
   */
  language?: string;
}

export interface SelectRoleDto {
  /**
   * @description User role to assign
   * @example candidate
   * @enum {string}
   */
  role: "candidate" | "hr" | "admin";
}

export interface RoleInfoDto {
  id: string;
  name: string;
  displayName: string;
}

export interface UserPermissionsResponseDto {
  userId: string;
  roles: RoleInfoDto[];
  permissions: string[];
}

export interface UpdateCandidateProfileDto {
  /**
   * @description List of candidate skills
   * @example ["JavaScript", "TypeScript", "Node.js", "React"]
   */
  skills?: string[];
  /**
   * @description Candidate experience level
   * @example mid
   * @enum {string}
   */
  experienceLevel?: "junior" | "mid" | "senior" | "lead";
}

export interface UpdateHRProfileDto {
  /**
   * @description Company name where HR works
   * @example Tech Corp Inc.
   */
  companyName?: string;
  /**
   * @description HR position/title
   * @example Senior Recruiter
   */
  position?: string;
}

// ==================== SCHEMAS COMPONENT TYPE ====================

export interface UserSchemas {
  SuspendUserDto: SuspendUserDto;
  UserResponseDto: UserResponseDto;
  UserListResponseDto: UserListResponseDto;
  UserStatsResponseDto: UserStatsResponseDto;
  CreateUserInternalDto: CreateUserInternalDto;
  UpdateUserInternalDto: UpdateUserInternalDto;
  SelectRoleDto: SelectRoleDto;
  RoleInfoDto: RoleInfoDto;
  UserPermissionsResponseDto: UserPermissionsResponseDto;
  UpdateCandidateProfileDto: UpdateCandidateProfileDto;
  UpdateHRProfileDto: UpdateHRProfileDto;
}

// ==================== PATHS ====================

export interface UserPaths {
  "/users/{userId}/suspend": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: UserOperations["UserAdminController_suspendUser"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/users/{userId}/activate": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: UserOperations["UserAdminController_activateUser"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/users": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: UserOperations["UsersController_listUsers"];
    put?: never;
    post: UserOperations["UsersController_createUser"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/users/stats": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: UserOperations["UsersController_getUserStats"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/users/{userId}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: UserOperations["UsersController_getUser"];
    put: UserOperations["UsersController_updateUser"];
    post?: never;
    delete: UserOperations["UsersController_deleteUser"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/users/by-external-auth/{externalAuthId}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: UserOperations["UsersController_getUserByExternalAuth"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/users/{userId}/avatar": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: UserOperations["UsersController_uploadAvatar"];
    delete: UserOperations["UsersController_deleteAvatar"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/users/{userId}/roles": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: UserOperations["UserProfilesController_assignRole"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/users/{userId}/permissions": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: UserOperations["UserProfilesController_getUserPermissions"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/users/{userId}/profiles/candidate": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put: UserOperations["UserProfilesController_updateCandidateProfile"];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/users/{userId}/profiles/hr": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put: UserOperations["UserProfilesController_updateHRProfile"];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}

// ==================== OPERATIONS ====================

export interface UserOperations {
  UserAdminController_suspendUser: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": SuspendUserDto;
      };
    };
    responses: {
      /** @description User suspended successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": UserResponseDto;
        };
      };
      /** @description Invalid request body or user is already suspended */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description User not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  UserAdminController_activateUser: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description User activated successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": UserResponseDto;
        };
      };
      /** @description User is already active */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description User not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  UsersController_listUsers: {
    parameters: {
      query?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: "active" | "suspended" | "deleted";
        role?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Users list retrieved successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": UserListResponseDto;
        };
      };
      /** @description Invalid query parameters */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  UsersController_createUser: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": CreateUserInternalDto;
      };
    };
    responses: {
      /** @description User created successfully */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Invalid request body */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description User already exists */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  UsersController_getUserStats: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description User statistics retrieved successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": UserStatsResponseDto;
        };
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  UsersController_getUser: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description User retrieved successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": UserResponseDto;
        };
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description User not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  UsersController_updateUser: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": UpdateUserInternalDto;
      };
    };
    responses: {
      /** @description User updated successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": UserResponseDto;
        };
      };
      /** @description Invalid request body */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description User not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  UsersController_deleteUser: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description User deleted successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description User not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  UsersController_getUserByExternalAuth: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        externalAuthId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description User retrieved successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": UserResponseDto;
        };
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description User not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  UsersController_uploadAvatar: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Avatar uploaded successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Invalid file format or size */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description User not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description File too large (max 5MB) */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  UsersController_deleteAvatar: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Avatar deleted successfully */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description User not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  UserProfilesController_assignRole: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": SelectRoleDto;
      };
    };
    responses: {
      /** @description Role assigned successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Invalid role or role already assigned */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description User not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  UserProfilesController_getUserPermissions: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description User permissions retrieved successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": UserPermissionsResponseDto;
        };
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description User not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  UserProfilesController_updateCandidateProfile: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": UpdateCandidateProfileDto;
      };
    };
    responses: {
      /** @description Candidate profile updated successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Invalid request body or user is not a candidate */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description User not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  UserProfilesController_updateHRProfile: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": UpdateHRProfileDto;
      };
    };
    responses: {
      /** @description HR profile updated successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Invalid request body or user is not an HR */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description User not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
}
