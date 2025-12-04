import {Injectable, HttpException, HttpStatus} from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {ConfigService} from '@nestjs/config';
import {firstValueFrom} from 'rxjs';
import {BaseServiceProxy} from '../../../proxies/base/base-service-proxy';
import {LoggerService} from '../../../core/logging/logger.service';
import {MetricsService} from '../../../core/metrics/metrics.service';
import {CircuitBreakerRegistry} from '../../../core/circuit-breaker/circuit-breaker-registry.service';
import type {
  CreateUserInternalDto,
  UpdateUserInternalDto,
  UserPermissionsResponseDto,
  UpdateCandidateProfileDto,
  UpdateHRProfileDto,
} from '../dto/internal.dto';
import type {
  UserResponseDto,
  UserListResponseDto,
  UserStatsResponseDto,
  SuspendUserDto,
} from '../dto/admin-user.dto';
import type {SelectRoleDto} from '../dto/user-profile.dto';
import type {
  CandidateSkillsByCategoryDto,
  AddCandidateSkillDto,
  UpdateCandidateSkillDto,
  SkillDto,
  SkillsListResponseDto,
  SkillCategoryDto,
  CreateSkillDto,
  UpdateSkillDto,
} from '../dto/skills.dto';

// ============================================================================
// Type Aliases for Client Methods
// ============================================================================

export type CreateUserDto = CreateUserInternalDto;
export type UpdateUserDto = UpdateUserInternalDto;
export {UserResponseDto, UserListResponseDto, UserStatsResponseDto};
export {SuspendUserDto, SelectRoleDto};
export {UserPermissionsResponseDto, UpdateCandidateProfileDto, UpdateHRProfileDto};

// ============================================================================
// Unified User Service Client
// ============================================================================

/**
 * Unified User Service Client
 *
 * Communicates with User Service using:
 * - Internal service token (X-Internal-Token header)
 * - Type-safe DTOs from generated OpenAPI contracts
 * - Updated endpoints: /users/* (no /internal prefix)
 *
 * All methods use internal authentication and direct HTTP calls.
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
  // USER CRUD OPERATIONS
  // ==========================================================================

  /**
   * Create user
   * Route: POST /users
   * Body: CreateUserInternalDto
   * Response: 201 Created
   */
  async createUser(dto: CreateUserDto): Promise<{ success: boolean; userId: string }> {
    try {
      this.loggerService.info('UserServiceClient: Creating user', {
        userId: dto.userId,
        email: dto.email,
      });

      await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/users`, dto, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );

      this.loggerService.info('UserServiceClient: User created successfully', {
        userId: dto.userId,
      });

      return {success: true, userId: dto.userId};
    } catch (error) {
      return this.handleInternalError(error, 'create user', {
        userId: dto.userId,
        email: dto.email,
      });
    }
  }

  /**
   * Get user by ID
   * Route: GET /users/:userId
   * Response: UserResponseDto
   */
  async getUserById(userId: string): Promise<UserResponseDto> {
    try {
      this.loggerService.info('UserServiceClient: Getting user by ID', {userId});

      const response = await firstValueFrom(
        this.httpService.get<UserResponseDto>(`${this.baseUrl}/users/${userId}`, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );

      return response.data;
    } catch (error) {
      return this.handleInternalError(error, 'get user by ID', {userId});
    }
  }

  /**
   * Get user by external auth ID (Keycloak ID)
   * Route: GET /users/by-external-auth/:externalAuthId
   * Response: UserResponseDto | null (404)
   */
  async getUserByExternalAuthId(externalAuthId: string): Promise<UserResponseDto | null> {
    try {
      this.loggerService.info('UserServiceClient: Getting user by external auth ID', {
        externalAuthId,
      });

      const response = await firstValueFrom(
        this.httpService.get<UserResponseDto>(
          `${this.baseUrl}/users/by-external-auth/${externalAuthId}`,
          {
            headers: this.getInternalHeaders(),
            timeout: this.timeout,
          },
        ),
      );

      return response.data;
    } catch (error) {
      // Return null if not found (404) - expected during first login
      if (error.response?.status === 404) {
        return null;
      }

      return this.handleInternalError(error, 'get user by external auth ID', {
        externalAuthId,
      });
    }
  }

  /**
   * Update user profile
   * Route: PUT /users/:userId
   * Body: UpdateUserInternalDto
   * Response: UserResponseDto
   */
  async updateUser(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      this.loggerService.info('UserServiceClient: Updating user', {userId});

      const response = await firstValueFrom(
        this.httpService.put<UserResponseDto>(`${this.baseUrl}/users/${userId}`, dto, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );

      this.loggerService.info('UserServiceClient: User updated successfully', {userId});

      return response.data;
    } catch (error) {
      return this.handleInternalError(error, 'update user', {userId});
    }
  }

  /**
   * Delete user
   * Route: DELETE /users/:userId
   * Response: 200 OK
   */
  async deleteUser(userId: string): Promise<{ success: boolean }> {
    try {
      this.loggerService.info('UserServiceClient: Deleting user', {userId});

      await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/users/${userId}`, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );

      this.loggerService.info('UserServiceClient: User deleted successfully', {userId});

      return {success: true};
    } catch (error) {
      return this.handleInternalError(error, 'delete user', {userId});
    }
  }

  // ==========================================================================
  // USER QUERY METHODS
  // ==========================================================================

  /**
   * List users with pagination and filters
   * Route: GET /users
   * Response: UserListResponseDto
   */
  async listUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'suspended' | 'deleted';
    role?: string;
  }): Promise<UserListResponseDto> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));
      if (params?.search) query.append('search', params.search);
      if (params?.status) query.append('status', params.status);
      if (params?.role) query.append('role', params.role);

      const url = `${this.baseUrl}/users${query.toString() ? '?' + query.toString() : ''}`;

      this.loggerService.info('UserServiceClient: Listing users', {params});

      const response = await firstValueFrom(
        this.httpService.get<UserListResponseDto>(url, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );

      return response.data;
    } catch (error) {
      return this.handleInternalError(error, 'list users', {params});
    }
  }

  /**
   * Get user statistics
   * Route: GET /users/stats
   * Response: UserStatsResponseDto
   */
  async getUserStats(): Promise<UserStatsResponseDto> {
    try {
      this.loggerService.info('UserServiceClient: Getting user statistics');

      const response = await firstValueFrom(
        this.httpService.get<UserStatsResponseDto>(`${this.baseUrl}/users/stats`, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );

      return response.data;
    } catch (error) {
      return this.handleInternalError(error, 'get user statistics', {});
    }
  }

  // ==========================================================================
  // ADMIN OPERATIONS
  // ==========================================================================

  /**
   * Suspend user (admin operation)
   * Route: POST /users/:userId/suspend
   * Body: SuspendUserDto { reason: string }
   * Response: UserResponseDto
   */
  async suspendUser(userId: string, dto: SuspendUserDto): Promise<UserResponseDto> {
    try {
      this.loggerService.info('UserServiceClient: Suspending user', {
        userId,
        reason: dto.reason,
      });

      const response = await firstValueFrom(
        this.httpService.post<UserResponseDto>(
          `${this.baseUrl}/users/${userId}/suspend`,
          dto,
          {
            headers: this.getInternalHeaders(),
            timeout: this.timeout,
          },
        ),
      );

      this.loggerService.info('UserServiceClient: User suspended successfully', {userId});

      return response.data;
    } catch (error) {
      return this.handleInternalError(error, 'suspend user', {userId});
    }
  }

  /**
   * Activate user (admin operation)
   * Route: POST /users/:userId/activate
   * Response: UserResponseDto
   */
  async activateUser(userId: string): Promise<UserResponseDto> {
    try {
      this.loggerService.info('UserServiceClient: Activating user', {userId});

      const response = await firstValueFrom(
        this.httpService.post<UserResponseDto>(
          `${this.baseUrl}/users/${userId}/activate`,
          {},
          {
            headers: this.getInternalHeaders(),
            timeout: this.timeout,
          },
        ),
      );

      this.loggerService.info('UserServiceClient: User activated successfully', {userId});

      return response.data;
    } catch (error) {
      return this.handleInternalError(error, 'activate user', {userId});
    }
  }

  // ==========================================================================
  // ROLES & PERMISSIONS
  // ==========================================================================

  /**
   * Assign role to user
   * Route: POST /users/:userId/roles
   * Body: SelectRoleDto { role: 'candidate' | 'hr' | 'admin' }
   * Response: 200 OK
   */
  async assignRole(
    userId: string,
    dto: SelectRoleDto,
  ): Promise<{ success: boolean; message: string; role: string }> {
    try {
      this.loggerService.info('UserServiceClient: Assigning role', {
        userId,
        role: dto.role,
      });

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/users/${userId}/roles`, dto, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );

      this.loggerService.info('UserServiceClient: Role assigned successfully', {
        userId,
        role: dto.role,
      });

      return response.data || {success: true, message: 'Role assigned', role: dto.role};
    } catch (error) {
      return this.handleInternalError(error, 'assign role', {
        userId,
        role: dto.role,
      });
    }
  }

  // ==========================================================================
  // PROFILE MANAGEMENT
  // ==========================================================================

  /**
   * Update candidate profile
   * Route: PUT /users/:userId/profiles/candidate
   * Body: UpdateCandidateProfileDto
   * Response: 200 OK
   */
  async updateCandidateProfile(
    userId: string,
    dto: UpdateCandidateProfileDto,
  ): Promise<{ success: boolean }> {
    try {
      this.loggerService.info('UserServiceClient: Updating candidate profile', {userId});

      await firstValueFrom(
        this.httpService.put(`${this.baseUrl}/users/${userId}/profiles/candidate`, dto, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );

      this.loggerService.info('UserServiceClient: Candidate profile updated', {userId});

      return {success: true};
    } catch (error) {
      return this.handleInternalError(error, 'update candidate profile', {userId});
    }
  }

  /**
   * Update HR profile
   * Route: PUT /users/:userId/profiles/hr
   * Body: UpdateHRProfileDto
   * Response: 200 OK
   */
  async updateHRProfile(
    userId: string,
    dto: UpdateHRProfileDto,
  ): Promise<{ success: boolean }> {
    try {
      this.loggerService.info('UserServiceClient: Updating HR profile', {userId});

      await firstValueFrom(
        this.httpService.put(`${this.baseUrl}/users/${userId}/profiles/hr`, dto, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );

      this.loggerService.info('UserServiceClient: HR profile updated', {userId});

      return {success: true};
    } catch (error) {
      return this.handleInternalError(error, 'update HR profile', {userId});
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
    this.loggerService.error(`UserServiceClient: Failed to ${operation}`, error, {
      errorResponse: error.response?.data,
      errorStatus: error.response?.status,
      errorStatusText: error.response?.statusText,
      errorCode: error.code,
      errorUrl: error.config?.url,
      errorMethod: error.config?.method,
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      ...context,
    });

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

  // ==========================================================================
  // SKILLS (Admin)
  // ==========================================================================

  /**
   * List skills with filters (Admin)
   * Route: GET /skills
   */
  async listSkills(filters: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
  }): Promise<SkillsListResponseDto> {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.search) params.append('search', filters.search);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/skills?${params}`, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );

      // User Service returns { success, data, pagination }
      // Data is already Read Models (plain objects) - no mapping needed
      const {data, pagination} = response.data;
      return {data, pagination};
    } catch (error) {
      throw this.handleInternalError(error, 'list skills', {});
    }
  }

  /**
   * Get skill by ID (Admin)
   * Route: GET /skills/:id
   */
  async getSkill(id: string): Promise<SkillDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/skills/${id}`, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );
      // Extract data from success wrapper (already Read Model)
      return response.data.data;
    } catch (error) {
      this.handleInternalError(error, 'get skill', {skillId: id});
    }
  }

  /**
   * Create skill (Admin)
   * Route: POST /skills
   */
  async createSkill(dto: CreateSkillDto, adminId: string): Promise<SkillDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/skills`, {...dto, adminId}, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );
      // Extract data from success wrapper (already Read Model)
      return response.data.data;
    } catch (error) {
      this.handleInternalError(error, 'create skill', {adminId});
    }
  }

  /**
   * Update skill (Admin)
   * Route: PUT /skills/:id
   *
   * User Service возвращает SkillSuccessResponseDto вида:
   * { success: true }
   */
  async updateSkill(id: string, dto: UpdateSkillDto, adminId: string): Promise<{ success: boolean }> {
    try {
      this.loggerService.info('UserServiceClient: Updating skill', {skillId: id, adminId});
      const response = await firstValueFrom(
        this.httpService.put(`${this.baseUrl}/skills/${id}`, {...dto, adminId}, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );

      this.loggerService.debug('UserServiceClient: Update skill response', {
        status: response.status,
        dataKeys: Object.keys(response.data || {}),
        data: response.data,
      });

      const result = response.data as { success: boolean };

      if (!result || typeof result.success !== 'boolean') {
        this.loggerService.error('UserServiceClient: Unexpected update skill response shape', {
          responseData: response.data,
        });
      }

      return result;
    } catch (error) {
      this.handleInternalError(error, 'update skill', {skillId: id, adminId});
      throw error;
    }
  }

  /**
   * Toggle skill active status (Admin)
   * Uses activate/deactivate commands based on current status
   */
  async toggleSkillStatus(id: string, adminId: string): Promise<SkillDto> {
    try {
      this.loggerService.info('UserServiceClient: Toggling skill status', {skillId: id, adminId});

      // Step 1: Get current skill to check isActive status
      const currentSkill = await this.getSkill(id);

      // Step 2: Call activate or deactivate based on current status
      let result: { success: boolean; data: SkillDto };
      if (currentSkill.isActive) {
        // Currently active -> deactivate
        result = await this.deactivateSkill(id, adminId);
      } else {
        // Currently inactive -> activate
        result = await this.activateSkill(id, adminId);
      }

      this.loggerService.info('UserServiceClient: Skill status toggled', {
        skillId: id,
        wasActive: currentSkill.isActive,
        nowActive: result.data.isActive,
      });

      return result.data;
    } catch (error) {
      throw this.handleInternalError(error, 'toggle skill status', {skillId: id, adminId});
    }
  }

  /**
   * Delete skill (Admin)
   * Route: DELETE /skills/:id
   */
  async deleteSkill(id: string, adminId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/skills/${id}`, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
          params: {adminId},
        }),
      );
      return response.data || {success: true, message: 'Skill deleted successfully'};
    } catch (error) {
      this.handleInternalError(error, 'delete skill', {skillId: id, adminId});
    }
  }

  /**
   * List skill categories
   * Route: GET /skills/categories
   */
  async listSkillCategories(): Promise<SkillCategoryDto[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/skills/categories`, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );
      // Extract data from success wrapper (already Read Models)
      return response.data.data || [];
    } catch (error) {
      this.handleInternalError(error, 'list skill categories', {});
    }
  }

  // ==========================================================================
  // CANDIDATE SKILLS
  // ==========================================================================

  /**
   * Get candidate skills grouped by category
   * Route: GET /candidates/:userId/skills
   */
  async getCandidateSkills(userId: string): Promise<CandidateSkillsByCategoryDto[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/candidates/${userId}/skills`, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );
      // Extract data from success wrapper (already Read Models)
      return response.data.data || [];
    } catch (error) {
      this.handleInternalError(error, 'get candidate skills', {userId});
    }
  }

  /**
   * Add skill to candidate profile
   * Route: POST /candidates/:userId/skills
   */
  async addCandidateSkill(userId: string, dto: AddCandidateSkillDto): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/candidates/${userId}/skills`, dto, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );
      // Command returns { success, message }
      return response.data;
    } catch (error) {
      this.handleInternalError(error, 'add candidate skill', {userId, skillId: dto.skillId});
    }
  }

  /**
   * Update candidate skill
   * Route: PUT /candidates/:userId/skills/:skillId
   */
  async updateCandidateSkill(userId: string, skillId: string, dto: UpdateCandidateSkillDto): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.put(`${this.baseUrl}/candidates/${userId}/skills/${skillId}`, dto, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );
      // Command returns { success, message }
      return response.data;
    } catch (error) {
      this.handleInternalError(error, 'update candidate skill', {userId, skillId});
    }
  }

  /**
   * Remove skill from candidate profile
   * Route: DELETE /candidates/:userId/skills/:skillId
   */
  async removeCandidateSkill(userId: string, skillId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/candidates/${userId}/skills/${skillId}`, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );
      return response.data || {success: true, message: 'Skill removed successfully'};
    } catch (error) {
      this.handleInternalError(error, 'remove candidate skill', {userId, skillId});
    }
  }

  // ==========================================================================
  // ADMIN SKILL OPERATIONS
  // ==========================================================================

  /**
   * Activate a skill (ADMIN ONLY)
   * Route: POST /skills/:id/activate?adminId=xxx
   */
  async activateSkill(skillId: string, adminId: string): Promise<{ success: boolean; data: SkillDto }> {
    try {
      this.loggerService.info('UserServiceClient: Activating skill', {skillId, adminId});

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/skills/${skillId}/activate`,
          {},
          {
            headers: this.getInternalHeaders(),
            params: {adminId},
            timeout: this.timeout,
          },
        ),
      );

      this.loggerService.info('UserServiceClient: Skill activated', {skillId});
      return response.data;
    } catch (error) {
      throw this.handleInternalError(error, 'activate skill', {skillId, adminId});
    }
  }

  /**
   * Deactivate a skill (ADMIN ONLY)
   * Route: POST /skills/:id/deactivate?adminId=xxx
   */
  async deactivateSkill(skillId: string, adminId: string): Promise<{ success: boolean; data: SkillDto }> {
    try {
      this.loggerService.info('UserServiceClient: Deactivating skill', {skillId, adminId});

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/skills/${skillId}/deactivate`,
          {},
          {
            headers: this.getInternalHeaders(),
            params: {adminId},
            timeout: this.timeout,
          },
        ),
      );

      this.loggerService.info('UserServiceClient: Skill deactivated', {skillId});
      return response.data;
    } catch (error) {
      throw this.handleInternalError(error, 'deactivate skill', {skillId, adminId});
    }
  }

  // ==========================================================================
  // CANDIDATE PROFILE OPERATIONS
  // ==========================================================================

  /**
   * Update candidate experience level
   * Route: PUT /candidates/:userId/experience-level
   */
  async updateExperienceLevel(
    userId: string,
    experienceLevel: 'junior' | 'mid' | 'senior' | 'lead',
  ): Promise<{ success: boolean; data: any }> {
    try {
      this.loggerService.info('UserServiceClient: Updating experience level', {userId, experienceLevel});

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/candidates/${userId}/experience-level`,
          {experienceLevel},
          {
            headers: this.getInternalHeaders(),
            timeout: this.timeout,
          },
        ),
      );

      this.loggerService.info('UserServiceClient: Experience level updated', {userId});
      return response.data;
    } catch (error) {
      throw this.handleInternalError(error, 'update experience level', {userId, experienceLevel});
    }
  }

  // ==========================================================================
  // USER PERMISSIONS & COMPANIES
  // ==========================================================================

  /**
   * Get user permissions
   * Route: GET /users/:userId/permissions
   */
  async getUserPermissions(userId: string): Promise<UserPermissionsResponseDto> {
    try {
      this.loggerService.info('UserServiceClient: Getting user permissions', {userId});

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users/${userId}/permissions`, {
          headers: this.getInternalHeaders(),
          timeout: this.timeout,
        }),
      );

      this.loggerService.info('UserServiceClient: Permissions retrieved', {userId});
      return response.data.data; // Unwrap { success, data }
    } catch (error) {
      throw this.handleInternalError(error, 'get user permissions', {userId});
    }
  }

  /**
   * Get user companies
   * Route: GET /users/:userId/companies?currentUserId=xxx&isAdmin=true
   */
  async getUserCompanies(
    userId: string,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<any[]> {
    try {
      this.loggerService.info('UserServiceClient: Getting user companies', {userId, currentUserId, isAdmin});

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users/${userId}/companies`, {
          headers: this.getInternalHeaders(),
          params: {currentUserId, isAdmin},
          timeout: this.timeout,
        }),
      );

      this.loggerService.info('UserServiceClient: Companies retrieved', {userId, count: response.data.data?.length});
      return response.data.data; // Unwrap { success, data }
    } catch (error) {
      throw this.handleInternalError(error, 'get user companies', {userId, currentUserId, isAdmin});
    }
  }
}
