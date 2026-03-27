import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseServiceProxy, ServiceProxyError } from '../../../proxies/base/base-service-proxy';
import { LoggerService } from '../../../core/logging/logger.service';
import { MetricsService } from '../../../core/metrics/metrics.service';
import { CircuitBreakerRegistry } from '../../../core/circuit-breaker/circuit-breaker-registry.service';
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
import type { SelectRoleDto } from '../dto/user-profile.dto';
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
import type {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyResponseDto,
  CompaniesListResponseDto,
  CompanyFilters,
} from '../dto/companies.dto';

// ============================================================================
// Type Aliases for Client Methods
// ============================================================================

export type CreateUserDto = CreateUserInternalDto;
export type UpdateUserDto = UpdateUserInternalDto;
export { UserResponseDto, UserListResponseDto, UserStatsResponseDto };
export { SuspendUserDto, SelectRoleDto };
export { UserPermissionsResponseDto, UpdateCandidateProfileDto, UpdateHRProfileDto };

// ============================================================================
// Unified User Service Client
// ============================================================================

/**
 * Unified User Service Client
 *
 * Extends BaseServiceProxy for circuit breaker, retry, metrics, and error handling.
 * Uses internal service token (X-Internal-Token header) for all requests.
 */
@Injectable()
export class UserServiceClient extends BaseServiceProxy {
  protected readonly serviceName = 'user-service';
  protected readonly baseUrl: string;
  private readonly internalToken: string;

  protected circuitBreakerOptions = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 5000,
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

    this.initCircuitBreaker();
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      ...super.getDefaultHeaders(),
      'X-Internal-Token': this.internalToken,
    };
  }

  // ==========================================================================
  // USER CRUD OPERATIONS
  // ==========================================================================

  /** POST /users — Create user */
  async createUser(dto: CreateUserDto): Promise<{ success: boolean; userId: string }> {
    try {
      await this.post<void>('/users', dto);
      return { success: true, userId: dto.userId };
    } catch (error) {
      throw this.mapUserError(error, 'create user', { userId: dto.userId });
    }
  }

  /** GET /users/:userId — Get user by ID */
  async getUserById(userId: string): Promise<UserResponseDto> {
    try {
      return await this.get<UserResponseDto>(`/users/${userId}`);
    } catch (error) {
      throw this.mapUserError(error, 'get user by ID', { userId });
    }
  }

  /** GET /users/by-external-auth/:externalAuthId — Get by Keycloak ID (returns null if 404) */
  async getUserByExternalAuthId(externalAuthId: string): Promise<UserResponseDto | null> {
    try {
      return await this.get<UserResponseDto>(`/users/by-external-auth/${externalAuthId}`);
    } catch (error) {
      if (error instanceof ServiceProxyError && error.statusCode === 404) {
        return null;
      }
      throw this.mapUserError(error, 'get user by external auth ID', { externalAuthId });
    }
  }

  /** PUT /users/:userId — Update user profile */
  async updateUser(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      return await this.put<UserResponseDto>(`/users/${userId}`, dto);
    } catch (error) {
      throw this.mapUserError(error, 'update user', { userId });
    }
  }

  /** DELETE /users/:userId — Delete user */
  async deleteUser(userId: string): Promise<{ success: boolean }> {
    try {
      await this.delete<void>(`/users/${userId}`);
      return { success: true };
    } catch (error) {
      throw this.mapUserError(error, 'delete user', { userId });
    }
  }

  // ==========================================================================
  // USER QUERY METHODS
  // ==========================================================================

  /** GET /users — List users with pagination and filters */
  async listUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'suspended' | 'deleted';
    role?: string;
  }): Promise<UserListResponseDto> {
    const queryParams: Record<string, any> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;
    if (params?.role) queryParams.role = params.role;

    return this.get<UserListResponseDto>('/users', { params: queryParams });
  }

  /** GET /users/stats — Get user statistics */
  async getUserStats(): Promise<UserStatsResponseDto> {
    return this.get<UserStatsResponseDto>('/users/stats');
  }

  // ==========================================================================
  // ADMIN OPERATIONS
  // ==========================================================================

  /** POST /users/:userId/suspend — Suspend user (admin operation) */
  async suspendUser(userId: string, dto: SuspendUserDto): Promise<UserResponseDto> {
    try {
      return await this.post<UserResponseDto>(`/users/${userId}/suspend`, dto);
    } catch (error) {
      throw this.mapUserError(error, 'suspend user', { userId });
    }
  }

  /** POST /users/:userId/activate — Activate user (admin operation) */
  async activateUser(userId: string): Promise<UserResponseDto> {
    try {
      return await this.post<UserResponseDto>(`/users/${userId}/activate`, {});
    } catch (error) {
      throw this.mapUserError(error, 'activate user', { userId });
    }
  }

  // ==========================================================================
  // ROLES & PERMISSIONS
  // ==========================================================================

  /** POST /users/:userId/roles — Assign role to user */
  async assignRole(
    userId: string,
    dto: SelectRoleDto,
  ): Promise<{ success: boolean; message: string; role: string }> {
    try {
      const result = await this.post<{ success: boolean; message: string; role: string }>(
        `/users/${userId}/roles`,
        dto,
      );
      return result || { success: true, message: 'Role assigned', role: dto.role };
    } catch (error) {
      throw this.mapUserError(error, 'assign role', { userId, role: dto.role });
    }
  }

  // ==========================================================================
  // PROFILE MANAGEMENT
  // ==========================================================================

  /** PUT /users/:userId/profiles/candidate — Update candidate profile */
  async updateCandidateProfile(
    userId: string,
    dto: UpdateCandidateProfileDto,
  ): Promise<{ success: boolean }> {
    await this.put<void>(`/users/${userId}/profiles/candidate`, dto);
    return { success: true };
  }

  /** PUT /users/:userId/profiles/hr — Update HR profile */
  async updateHRProfile(
    userId: string,
    dto: UpdateHRProfileDto,
  ): Promise<{ success: boolean }> {
    await this.put<void>(`/users/${userId}/profiles/hr`, dto);
    return { success: true };
  }

  // ==========================================================================
  // SKILLS (Admin)
  // ==========================================================================

  /** GET /skills — List skills with filters */
  async listSkills(filters: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
  }): Promise<SkillsListResponseDto> {
    const params: Record<string, any> = {};
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    if (filters.search) params.search = filters.search;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.isActive !== undefined) params.isActive = filters.isActive;

    const response = await this.get<{ data: any; pagination: any }>('/skills', { params });
    return { data: response.data, pagination: response.pagination };
  }

  /** GET /skills/:id — Get skill by ID */
  async getSkill(id: string): Promise<SkillDto> {
    const response = await this.get<{ data: SkillDto }>(`/skills/${id}`);
    return response.data;
  }

  /** POST /skills — Create skill */
  async createSkill(dto: CreateSkillDto, adminId: string): Promise<SkillDto> {
    const response = await this.post<{ data: SkillDto }>('/skills', { ...dto, adminId });
    return response.data;
  }

  /** PUT /skills/:id — Update skill */
  async updateSkill(id: string, dto: UpdateSkillDto, adminId: string): Promise<{ success: boolean }> {
    return this.put<{ success: boolean }>(`/skills/${id}`, { ...dto, adminId });
  }

  /** Toggle skill active status — activate/deactivate based on current state */
  async toggleSkillStatus(id: string, adminId: string): Promise<SkillDto> {
    const currentSkill = await this.getSkill(id);

    const result = currentSkill.isActive
      ? await this.deactivateSkill(id, adminId)
      : await this.activateSkill(id, adminId);

    return result.data;
  }

  /** DELETE /skills/:id — Delete skill */
  async deleteSkill(id: string, adminId: string): Promise<{ success: boolean; message: string }> {
    await this.delete<void>(`/skills/${id}`, { params: { adminId } });
    return { success: true, message: 'Skill deleted successfully' };
  }

  /** GET /skills/categories — List skill categories */
  async listSkillCategories(): Promise<SkillCategoryDto[]> {
    const response = await this.get<{ data: SkillCategoryDto[] }>('/skills/categories');
    return response.data || [];
  }

  // ==========================================================================
  // CANDIDATE SEARCH (HR)
  // ==========================================================================

  /** GET /candidates/search — Search candidates by skills */
  async searchCandidates(filters: {
    skillIds?: string[];
    minProficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    minYears?: number;
    experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead';
    page?: number;
    limit?: number;
  }): Promise<{
    data: any[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    // Build query string manually for proper array serialization (skillIds=a&skillIds=b)
    const qs = new URLSearchParams();
    if (filters.skillIds?.length) {
      filters.skillIds.forEach((id) => qs.append('skillIds', id));
    }
    if (filters.minProficiency) qs.append('minProficiency', filters.minProficiency);
    if (filters.minYears !== undefined) qs.append('minYears', String(filters.minYears));
    if (filters.experienceLevel) qs.append('experienceLevel', filters.experienceLevel);
    if (filters.page) qs.append('page', String(filters.page));
    if (filters.limit) qs.append('limit', String(filters.limit));

    const path = `/candidates/search${qs.toString() ? `?${qs}` : ''}`;
    const response = await this.get<{ data: any[]; pagination: any }>(path);

    return {
      data: response.data || [],
      pagination: response.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  }

  // ==========================================================================
  // CANDIDATE PROFILE
  // ==========================================================================

  /** GET /candidates/:userId/profile — Get candidate profile */
  async getCandidateProfile(userId: string): Promise<{ experienceLevel: string | null }> {
    try {
      const response = await this.get<{ data: { experienceLevel: string | null } }>(
        `/candidates/${userId}/profile`,
        { params: { currentUserId: userId } },
      );
      return { experienceLevel: response.data?.experienceLevel || null };
    } catch {
      return { experienceLevel: null };
    }
  }

  // ==========================================================================
  // CANDIDATE SKILLS
  // ==========================================================================

  /** GET /candidates/:userId/skills — Get candidate skills grouped by category */
  async getCandidateSkills(userId: string, currentUserId: string): Promise<CandidateSkillsByCategoryDto[]> {
    const response = await this.get<{ data: CandidateSkillsByCategoryDto[] }>(
      `/candidates/${userId}/skills`,
      { params: { currentUserId } },
    );
    return response.data || [];
  }

  /** POST /candidates/:userId/skills — Add skill to candidate profile */
  async addCandidateSkill(userId: string, dto: AddCandidateSkillDto): Promise<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>(`/candidates/${userId}/skills`, dto);
  }

  /** PUT /candidates/:userId/skills/:skillId — Update candidate skill */
  async updateCandidateSkill(
    userId: string,
    skillId: string,
    dto: UpdateCandidateSkillDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.put<{ success: boolean; message: string }>(
      `/candidates/${userId}/skills/${skillId}`,
      dto,
    );
  }

  /** DELETE /candidates/:userId/skills/:skillId — Remove skill from candidate profile */
  async removeCandidateSkill(userId: string, skillId: string): Promise<{ success: boolean; message: string }> {
    await this.delete<void>(`/candidates/${userId}/skills/${skillId}`);
    return { success: true, message: 'Skill removed successfully' };
  }

  // ==========================================================================
  // ADMIN SKILL OPERATIONS
  // ==========================================================================

  /** POST /skills/:id/activate — Activate a skill (Admin) */
  async activateSkill(skillId: string, adminId: string): Promise<{ success: boolean; data: SkillDto }> {
    return this.post<{ success: boolean; data: SkillDto }>(
      `/skills/${skillId}/activate`,
      {},
      { params: { adminId } },
    );
  }

  /** POST /skills/:id/deactivate — Deactivate a skill (Admin) */
  async deactivateSkill(skillId: string, adminId: string): Promise<{ success: boolean; data: SkillDto }> {
    return this.post<{ success: boolean; data: SkillDto }>(
      `/skills/${skillId}/deactivate`,
      {},
      { params: { adminId } },
    );
  }

  // ==========================================================================
  // CANDIDATE PROFILE OPERATIONS
  // ==========================================================================

  /** PUT /candidates/:userId/experience-level — Update candidate experience level */
  async updateExperienceLevel(
    userId: string,
    experienceLevel: 'junior' | 'mid' | 'senior' | 'lead',
  ): Promise<{ success: boolean; data: any }> {
    return this.put<{ success: boolean; data: any }>(
      `/candidates/${userId}/experience-level`,
      { experienceLevel },
    );
  }

  // ==========================================================================
  // USER PERMISSIONS & COMPANIES
  // ==========================================================================

  /** GET /users/:userId/permissions — Get user permissions */
  async getUserPermissions(userId: string): Promise<UserPermissionsResponseDto> {
    const response = await this.get<{ data: UserPermissionsResponseDto }>(
      `/users/${userId}/permissions`,
    );
    return response.data;
  }

  /** GET /users/:userId/companies — Get user companies */
  async getUserCompanies(
    userId: string,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<any[]> {
    const response = await this.get<{ data: any[] }>(
      `/users/${userId}/companies`,
      { params: { currentUserId, isAdmin } },
    );
    return response.data;
  }

  // ==========================================================================
  // COMPANIES CRUD (HR)
  // ==========================================================================

  /** POST /companies — Create company */
  async createCompany(dto: CreateCompanyDto, userId: string): Promise<CompanyResponseDto> {
    const response = await this.post<{ data: CompanyResponseDto }>('/companies', {
      ...dto,
      createdBy: userId,
    });
    return response.data;
  }

  /** GET /companies — List companies with filters */
  async listCompanies(
    filters: CompanyFilters,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<CompaniesListResponseDto> {
    const params: Record<string, any> = {
      currentUserId,
      isAdmin,
    };
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    if (filters.search) params.search = filters.search;
    if (filters.industry) params.industry = filters.industry;
    if (filters.isActive !== undefined) params.isActive = filters.isActive;
    if (!isAdmin) params.createdBy = currentUserId;

    const response = await this.get<{ data: any[]; pagination: any }>('/companies', { params });

    return {
      data: response.data || [],
      pagination: response.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  }

  /** GET /companies/:id — Get company by ID */
  async getCompanyById(
    id: string,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<CompanyResponseDto> {
    const response = await this.get<{ data: CompanyResponseDto }>(
      `/companies/${id}`,
      { params: { userId: currentUserId, isAdmin } },
    );
    return response.data;
  }

  /** PUT /companies/:id — Update company */
  async updateCompany(
    id: string,
    dto: UpdateCompanyDto,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<CompanyResponseDto> {
    const response = await this.put<{ data: CompanyResponseDto }>(
      `/companies/${id}`,
      { ...dto, updatedBy: currentUserId },
    );
    return response.data;
  }

  /** DELETE /companies/:id — Delete company */
  async deleteCompany(
    id: string,
    currentUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.delete<void>(`/companies/${id}`, {
      params: { userId: currentUserId },
    });
    return { success: true, message: 'Company deleted successfully' };
  }

  // ==========================================================================
  // PRIVATE — Error mapping for User Service specific codes
  // ==========================================================================

  /**
   * Maps ServiceProxyError to domain-specific HttpExceptions.
   * Used only for methods that need special error handling (409, 404, timeouts).
   */
  private mapUserError(
    error: unknown,
    operation: string,
    context: Record<string, any>,
  ): never {
    if (error instanceof ServiceProxyError) {
      if (error.statusCode === 409) {
        throw new HttpException(
          { success: false, error: 'User already exists in User Service', code: 'USER_ALREADY_EXISTS' },
          HttpStatus.CONFLICT,
        );
      }
      if (error.statusCode === 404) {
        throw new HttpException(
          { success: false, error: 'User not found in User Service', code: 'USER_NOT_FOUND' },
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Let ServiceProxyExceptionFilter handle the rest
    throw error;
  }
}
