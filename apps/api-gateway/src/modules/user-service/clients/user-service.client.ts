import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { BaseServiceProxy } from '../../../proxies/base/base-service-proxy';
import { LoggerService } from '../../../core/logging/logger.service';
import { MetricsService } from '../../../core/metrics/metrics.service';
import { CircuitBreakerRegistry } from '../../../core/circuit-breaker/circuit-breaker-registry.service';
import { CreateUserInternalDto, CreateUserInternalResponse } from '../admin/dto/create-user-internal.dto';

// ============================================================================
// DTOs
// ============================================================================

export interface UserDTO {
  id: string;
  externalAuthId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  lastLoginAt?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileDTO {
  userId: string;
  bio?: string;
  phone?: string;
  company?: string;
  position?: string;
  location?: string;
}

export interface QuotaReservationDTO {
  reservationId: string;
  userId: string;
  resourceType: string;
  expiresAt: string;
}

export interface UserStatsDTO {
  userId: string;
  interviewsCount: number;
  storageUsedMB: number;
  quotaRemaining: {
    interviews: number;
    storageMB: number;
  };
}

// ============================================================================
// Unified User Service Client
// ============================================================================

/**
 * Unified User Service Client
 * 
 * Supports two modes:
 * 1. Proxy mode (with circuit breaker) - for user-facing requests via /users/*
 * 2. Internal mode (with internal token) - for Saga orchestration via /internal/*
 * 
 * Replaces:
 * - UserServiceProxy (proxies/user-service.proxy.ts)
 * - UserServiceHttpClient (admin/user-service-http.client.ts)
 */
@Injectable()
export class UserServiceClient extends BaseServiceProxy {
  protected readonly serviceName = 'user-service';
  protected readonly baseUrl: string;
  private readonly timeout: number = 5000;
  private readonly internalToken: string;

  // Circuit breaker configuration
  protected circuitBreakerOptions = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 3000,
    resetTimeout: 30000,
  };

  constructor(
    httpService: HttpService,
    loggerService: LoggerService,
    metricsService: MetricsService,
    circuitBreakerRegistry: CircuitBreakerRegistry,
    private readonly configService: ConfigService,
  ) {
    super(httpService, loggerService, metricsService, circuitBreakerRegistry);
    
    this.baseUrl =
      this.configService.get<string>('USER_SERVICE_URL') ||
      'http://localhost:8002';
    
    this.internalToken = this.configService.get<string>(
      'INTERNAL_SERVICE_TOKEN',
      'internal-secret',
    );

    // Initialize circuit breaker
    this.initCircuitBreaker();
  }

  // ==========================================================================
  // PROXY METHODS (with circuit breaker, for user-facing requests)
  // ==========================================================================

  /**
   * Get current user profile
   * Route: GET /users/me
   * Uses: JWT token from user
   */
  async getCurrentUserProfile(authHeader?: string): Promise<UserDTO> {
    return this.get<UserDTO>(`/users/me`, {
      timeout: 3000,
      headers: authHeader ? { Authorization: authHeader } : {},
    });
  }

  /**
   * Update current user profile
   * Route: PUT /users/me
   * Uses: JWT token from user
   */
  async updateCurrentUserProfile(
    authHeader?: string,
    updates?: any,
  ): Promise<UserDTO> {
    return this.put<UserDTO>(`/users/me`, updates, {
      timeout: 5000,
      headers: authHeader ? { Authorization: authHeader } : {},
    });
  }

  /**
   * Reserve interview quota
   * Route: POST /users/:userId/quota/reserve
   */
  async reserveInterviewQuota(userId: string): Promise<QuotaReservationDTO> {
    return this.post<QuotaReservationDTO>(
      `/users/${userId}/quota/reserve`,
      { resourceType: 'interview' },
      {
        timeout: 3000,
        retries: 2,
      },
    );
  }

  /**
   * Release reserved quota
   * Route: DELETE /users/:userId/quota/reservations/:reservationId
   */
  async releaseQuota(userId: string, reservationId: string): Promise<void> {
    return this.delete<void>(
      `/users/${userId}/quota/reservations/${reservationId}`,
      { timeout: 3000 },
    );
  }

  /**
   * Get user statistics
   * Route: GET /users/:userId/stats
   */
  async getUserStats(userId: string): Promise<UserStatsDTO> {
    return this.get<UserStatsDTO>(`/users/${userId}/stats`, {
      timeout: 5000,
    });
  }

  /**
   * Check if user exists by email
   * Route: GET /users/check?email=...
   */
  async checkUserExists(email: string): Promise<{ exists: boolean }> {
    return this.get<{ exists: boolean }>(`/users/check?email=${email}`, {
      timeout: 2000,
    });
  }

  /**
   * List users (admin)
   * Route: GET /users?page=...&limit=...&search=...
   */
  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ users: UserDTO[]; total: number; page: number }> {
    const query = new URLSearchParams({
      page: String(params.page || 1),
      limit: String(params.limit || 20),
      ...(params.search && { search: params.search }),
    });

    return this.get<{ users: UserDTO[]; total: number; page: number }>(
      `/users?${query}`,
      { timeout: 5000 },
    );
  }

  // ==========================================================================
  // INTERNAL METHODS (direct HTTP, for Saga orchestration)
  // ==========================================================================

  /**
   * Create user (internal)
   * Route: POST /internal/users
   * Uses: Internal service token
   * Used by: UserOrchestrationSaga, RegistrationSaga
   */
  async createUserInternal(
    dto: CreateUserInternalDto,
  ): Promise<CreateUserInternalResponse> {
    try {
      const url = `${this.baseUrl}/internal/users`;
      const headers = this.getInternalHeaders();
      
      this.loggerService.info('UserServiceClient: Creating user (internal) - REQUEST', {
        url,
        method: 'POST',
        dto,
        headers: { ...headers, 'X-Internal-Token': '***' }, // Hide token in logs
        timeout: this.timeout,
      });

      const response = await firstValueFrom(
        this.httpService.post<CreateUserInternalResponse>(
          url,
          dto,
          {
            headers,
            timeout: this.timeout,
          },
        ),
      );
      
      this.loggerService.info('UserServiceClient: Creating user (internal) - RESPONSE', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });

      this.loggerService.info(
        'UserServiceClient: User created successfully (internal)',
        { userId: dto.userId },
      );

      return response.data;
    } catch (error) {
      return this.handleInternalError(
        error,
        'create user',
        { userId: dto.userId, email: dto.email },
      );
    }
  }

  /**
   * Update user profile (internal)
   * Route: PUT /internal/users/:id
   * Uses: Internal service token
   * Used by: UsersController (for updating user profile)
   */
  async updateUserProfileInternal(
    userId: string,
    dto: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      phone?: string;
      timezone?: string;
      language?: string;
    },
  ): Promise<UserDTO> {
    try {
      this.loggerService.info('UserServiceClient: Updating user profile (internal)', {
        userId,
      });

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/internal/users/${userId}`,
          dto,
          {
            headers: this.getInternalHeaders(),
            timeout: this.timeout,
          },
        ),
      );

      this.loggerService.info(
        'UserServiceClient: User profile updated successfully (internal)',
        { userId },
      );

      return response.data;
    } catch (error) {
      return this.handleInternalError(error, 'update user profile', { userId });
    }
  }

  /**
   * @deprecated Use updateUserProfileInternal() instead
   * Update user (internal) - kept for backward compatibility
   */
  async updateUserInternal(
    userId: string,
    dto: { firstName?: string; lastName?: string },
  ): Promise<any> {
    return this.updateUserProfileInternal(userId, dto);
  }

  /**
   * Delete user (internal)
   * Route: DELETE /internal/users/:id
   * Uses: Internal service token
   * Used by: UserOrchestrationSaga
   */
  async deleteUserInternal(userId: string): Promise<any> {
    try {
      this.loggerService.info('UserServiceClient: Deleting user (internal)', {
        userId,
      });

      const response = await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/internal/users/${userId}`, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );

      this.loggerService.info(
        'UserServiceClient: User deleted successfully (internal)',
        { userId },
      );

      return response.data;
    } catch (error) {
      return this.handleInternalError(error, 'delete user', { userId });
    }
  }

  /**
   * Select role (internal)
   * Route: POST /internal/users/:userId/select-role
   * Uses: Internal service token
   * Used by: UserOrchestrationSaga
   * NEW: Replaces old assignRoleInternal - uses new role selection system
   */
  async assignRoleInternal(userId: string, roleName: string): Promise<any> {
    try {
      this.loggerService.info('UserServiceClient: Selecting role (internal)', {
        userId,
        role: roleName,
      });

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/internal/users/${userId}/select-role`,
          { role: roleName },
          {
            headers: this.getInternalHeaders(),
            timeout: this.timeout,
          },
        ),
      );

      this.loggerService.info(
        'UserServiceClient: Role selected successfully (internal)',
        { userId, role: roleName },
      );

      return response.data;
    } catch (error) {
      return this.handleInternalError(error, 'select role', {
        userId,
        role: roleName,
      });
    }
  }

  /**
   * Remove role (internal)
   * Route: DELETE /internal/users/:id/roles/:roleName
   * Uses: Internal service token
   * Used by: UserOrchestrationSaga
   */
  async removeRoleInternal(userId: string, roleName: string): Promise<any> {
    try {
      this.loggerService.info('UserServiceClient: Removing role (internal)', {
        userId,
        roleName,
      });

      const response = await firstValueFrom(
        this.httpService.delete(
          `${this.baseUrl}/internal/users/${userId}/roles/${roleName}`,
          {
            headers: this.getInternalHeaders(),
            timeout: this.timeout,
          },
        ),
      );

      this.loggerService.info(
        'UserServiceClient: Role removed successfully (internal)',
        { userId, roleName },
      );

      return response.data;
    } catch (error) {
      return this.handleInternalError(error, 'remove role', {
        userId,
        roleName,
      });
    }
  }

  /**
   * Get user by ID (internal)
   * Route: GET /internal/users/:userId
   * Uses: Internal service token
   * Used by: UsersController (for getting user profile)
   */
  async getUserByIdInternal(userId: string): Promise<UserDTO> {
    try {
      this.loggerService.info(
        'UserServiceClient: Getting user by ID (internal)',
        { userId },
      );

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/internal/users/${userId}`,
          {
            headers: this.getInternalHeaders(),
            timeout: this.timeout,
          },
        ),
      );

      return response.data;
    } catch (error) {
      return this.handleInternalError(error, 'get user by ID', { userId });
    }
  }

  /**
   * Get user by external auth ID (internal)
   * Route: GET /internal/users/by-external-auth/:externalAuthId
   * Uses: Internal service token
   * Used by: RegistrationSaga (for checking if user exists)
   */
  async getUserByExternalAuthId(externalAuthId: string): Promise<UserDTO | null> {
    try {
      this.loggerService.info(
        'UserServiceClient: Getting user by external auth ID (internal)',
        { externalAuthId },
      );

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/internal/users/by-external-auth/${externalAuthId}`,
          {
            headers: this.getInternalHeaders(),
            timeout: this.timeout,
          },
        ),
      );

      return response.data;
    } catch (error) {
      // Return null if not found (404) - this is expected during login flow
      if (error.response?.status === 404) {
        return null;
      }

      return this.handleInternalError(error, 'get user by external auth ID', {
        externalAuthId,
      });
    }
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Get headers for internal service communication
   */
  private getInternalHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Internal-Token': this.internalToken,
    };
  }

  /**
   * Handle errors for internal methods
   */
  private handleInternalError(
    error: any,
    operation: string,
    context: Record<string, any>,
  ): never {
    this.loggerService.error(
      `UserServiceClient: Failed to ${operation}`,
      error,
      {
        errorResponse: error.response?.data,
        errorStatus: error.response?.status,
        errorStatusText: error.response?.statusText,
        errorCode: error.code,
        errorUrl: error.config?.url,
        errorMethod: error.config?.method,
        baseUrl: this.baseUrl,
        timeout: this.timeout,
        ...context,
      },
    );

    // Handle specific HTTP errors
    if (error.response?.status === 409) {
      throw new HttpException(
        {
          success: false,
          error: `User already exists in User Service`,
          code: 'USER_ALREADY_EXISTS',
        },
        HttpStatus.CONFLICT,
      );
    }

    if (error.response?.status === 404) {
      throw new HttpException(
        {
          success: false,
          error: 'User not found in User Service',
          code: 'USER_NOT_FOUND',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (error.code === 'ECONNABORTED') {
      throw new HttpException(
        {
          success: false,
          error: 'User Service timeout',
          code: 'USER_SERVICE_TIMEOUT',
        },
        HttpStatus.REQUEST_TIMEOUT,
      );
    }

    if (error.code === 'ECONNREFUSED') {
      throw new HttpException(
        {
          success: false,
          error: 'User Service unavailable',
          code: 'USER_SERVICE_UNAVAILABLE',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    throw new HttpException(
      {
        success: false,
        error: `Failed to ${operation} in User Service`,
        details: error.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
