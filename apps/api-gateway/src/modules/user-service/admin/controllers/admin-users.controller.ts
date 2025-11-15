import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { KeycloakUserService } from '../keycloak';
import { LoggerService } from '../../../../core/logging/logger.service';
import { UserOrchestrationSaga } from '../user-orchestration.saga';
import { UserServiceClient } from '../../clients/user-service.client';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto,
  CreateUserResponseDto,
  UserListResponseDto,
  UserStatsResponseDto
} from '../../dto/admin-user.dto';

/**
 * Admin Users Controller
 * Handles user CRUD operations via Saga Orchestration
 * 
 * Endpoints:
 * - POST   /api/admin/users          - Create user (Saga)
 * - GET    /api/admin/users          - List users (Keycloak + User Service enrichment)
 * - GET    /api/admin/users/stats    - Get user statistics (User Service)
 * - GET    /api/admin/users/:id      - Get user (Keycloak)
 * - PUT    /api/admin/users/:id      - Update user (Saga)
 * - DELETE /api/admin/users/:id      - Delete user (Saga)
 */
@ApiTags('Admin - Users')
@ApiBearerAuth()
@Controller('api/admin/users')
export class AdminUsersController {
  constructor(
    private readonly keycloakUserService: KeycloakUserService,
    private readonly loggerService: LoggerService,
    private readonly userOrchestrationSaga: UserOrchestrationSaga,
    private readonly userServiceClient: UserServiceClient,
  ) {}

  /**
   * POST /api/admin/users
   * Создаёт нового пользователя через Saga Orchestration
   * 
   * Тестирование через curl:
   * curl -X POST http://localhost:8001/api/admin/users \
   *   -H "Content-Type: application/json" \
   *   -d '{"email":"test@example.com","firstName":"Test","lastName":"User"}'
   */
  @Post()
  @ApiOperation({ 
    summary: 'Create new user',
    description: 'Creates a new user via Saga Orchestration (Keycloak + User Service). Returns immediately with userId and keycloakId.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    type: CreateUserResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input or email already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Admin role required' })
  async createUser(@Body() body: CreateUserDto) {
    this.loggerService.info('Admin: Creating user via Saga', {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
    });

    // Execute Saga orchestration (Keycloak + User Service)
    const result = await this.userOrchestrationSaga.executeCreateUser({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      password: body.password || 'password',
    });

    // Return immediate response (synchronous!)
    return {
      success: true,
      data: {
        userId: result.userId,
        keycloakId: result.keycloakId,
        email: body.email,
      },
    };
  }

  /**
   * GET /api/admin/users
   * Получить список пользователей
   * 
   * curl http://localhost:8001/api/admin/users
   * curl "http://localhost:8001/api/admin/users?search=test"
   */
  @Get()
  @ApiOperation({ 
    summary: 'List all users',
    description: 'Returns list of users from Keycloak enriched with User Service data (lastLoginAt, etc.)'
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search by email, first name, or last name' })
  @ApiQuery({ name: 'max', required: false, type: Number, description: 'Maximum number of results (default: 100)' })
  @ApiQuery({ name: 'first', required: false, type: Number, description: 'Offset for pagination (default: 0)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Users list retrieved successfully',
    type: UserListResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listUsers(
    @Query('search') search?: string,
    @Query('max') max?: number,
    @Query('first') first?: number,
  ) {
    this.loggerService.info('Admin: Listing users', { search, max, first });

    try {
      const keycloakUsers = await this.keycloakUserService.listUsers({
        search,
        max: max || 100,
        first: first || 0,
      });

      // Enrich with User Service data (last_login_at, etc.)
      const enrichedUsers = await Promise.all(
        keycloakUsers.map(async (kcUser) => {
          try {
            const userServiceData = await this.userServiceClient.getUserByExternalAuthId(kcUser.id);
            return {
              ...kcUser,
              lastLoginAt: userServiceData?.lastLoginAt || null,
            };
          } catch (error) {
            // User might not exist in User Service yet
            this.loggerService.debug('User not found in User Service', { keycloakId: kcUser.id });
            return {
              ...kcUser,
              lastLoginAt: null,
            };
          }
        })
      );

      this.loggerService.info('Admin: Users listed successfully', {
        count: enrichedUsers.length,
      });

      return {
        success: true,
        data: enrichedUsers,
        count: enrichedUsers.length,
      };
    } catch (error) {
      this.loggerService.error('Admin: Failed to list users', error);
      throw error;
    }
  }

  /**
   * GET /api/admin/users/stats
   * Получить статистику пользователей из User Service
   * 
   * curl http://localhost:8001/api/admin/users/stats
   */
  @Get('stats')
  @ApiOperation({ 
    summary: 'Get user statistics',
    description: 'Returns aggregated user statistics (total, active, suspended, by role, etc.)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully',
    type: UserStatsResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserStats() {
    this.loggerService.info('Admin: Getting user statistics from User Service');

    try {
      const stats = await this.userServiceClient.getUserStats();

      this.loggerService.info('Admin: User statistics retrieved successfully', {
        totalUsers: stats.totalUsers,
      });

      return stats;
    } catch (error) {
      this.loggerService.error('Admin: Failed to get user statistics', error);
      throw error;
    }
  }

  /**
   * GET /api/admin/users/:id
   * Получить пользователя по ID
   * 
   * curl http://localhost:8001/api/admin/users/b2e22c9c-27bd-4fae-b29f-508d32a4dea9
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Returns user details by Keycloak ID'
  })
  @ApiParam({ name: 'id', description: 'Keycloak user ID (UUID)' })
  @ApiResponse({ 
    status: 200, 
    description: 'User retrieved successfully',
    type: UserResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string) {
    this.loggerService.info('Admin: Getting user', { userId: id });

    try {
      const user = await this.keycloakUserService.getUser(id);

      this.loggerService.info('Admin: User retrieved successfully', { userId: id });

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      this.loggerService.error('Admin: Failed to get user', error, { userId: id });
      throw error;
    }
  }

  /**
   * PUT /api/admin/users/:id
   * Обновить пользователя
   * 
   * curl -X PUT http://localhost:8001/api/admin/users/b2e22c9c-27bd-4fae-b29f-508d32a4dea9 \
   *   -H "Content-Type: application/json" \
   *   -d '{"firstName":"Updated","lastName":"Name"}'
   */
  @Put(':id')
  @ApiOperation({ 
    summary: 'Update user',
    description: 'Updates user via Saga Orchestration (Keycloak + User Service)'
  })
  @ApiParam({ name: 'id', description: 'Keycloak user ID (UUID)' })
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ) {
    this.loggerService.info('Admin: Updating user via Saga', { userId: id, updates: body });

    // Execute Saga orchestration
    const result = await this.userOrchestrationSaga.executeUpdateUser(id, {
      firstName: body.firstName,
      lastName: body.lastName,
    });

    return result;
  }

  /**
   * DELETE /api/admin/users/:id
   * Удалить пользователя
   * 
   * curl -X DELETE http://localhost:8001/api/admin/users/b2e22c9c-27bd-4fae-b29f-508d32a4dea9
   */
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete user',
    description: 'Deletes user via Saga Orchestration (Keycloak + User Service)'
  })
  @ApiParam({ name: 'id', description: 'Keycloak user ID (UUID)' })
  @ApiResponse({ 
    status: 200, 
    description: 'User deleted successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string) {
    this.loggerService.info('Admin: Deleting user via Saga', { userId: id });

    // Execute Saga orchestration
    const result = await this.userOrchestrationSaga.executeDeleteUser(id);

    return result;
  }
}
