import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { KeycloakUserService, KeycloakRoleService, KeycloakEmailService } from './keycloak';
import { LoggerService } from '../core/logging/logger.service';
import { UserOrchestrationSaga } from './user-orchestration.saga';
import { UserCommandPublisher } from './user-command-publisher.service';
import { UserServiceClient } from '../clients';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

/**
 * Admin Controller
 * Управление пользователями через Saga Orchestration Pattern
 * 
 * Architecture:
 * - Uses UserOrchestrationSaga for distributed transactions (CRUD, roles)
 * - Coordinates Keycloak + User Service with rollback support
 * - Synchronous HTTP communication with 5s timeout
 * - Immediate response to frontend
 * - Suspend/Activate remain async via Kafka (not critical for immediate response)
 * 
 * NOTE: Guards temporarily removed for script-based user creation
 * TODO: Add @UseGuards(JwtAuthGuard, RolesGuard) + @Roles('admin') when dashboard is ready
 */
@Controller('api/admin')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('admin')
export class AdminController {
  constructor(
    private readonly keycloakUserService: KeycloakUserService,
    private readonly keycloakRoleService: KeycloakRoleService,
    private readonly keycloakEmailService: KeycloakEmailService,
    private readonly loggerService: LoggerService,
    private readonly userOrchestrationSaga: UserOrchestrationSaga,
    private readonly userCommandPublisher: UserCommandPublisher,
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
  @Post('users')
  async createUser(@Body() body: {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
  }) {
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
  @Get('users')
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
   * GET /api/admin/users/:id
   * Получить пользователя по ID
   * 
   * curl http://localhost:8001/api/admin/users/b2e22c9c-27bd-4fae-b29f-508d32a4dea9
   */
  @Get('users/:id')
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
  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      enabled?: boolean;
    },
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
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    this.loggerService.info('Admin: Deleting user via Saga', { userId: id });

    // Execute Saga orchestration
    const result = await this.userOrchestrationSaga.executeDeleteUser(id);

    return result;
  }

  /**
   * GET /api/admin/roles
   * Получить список доступных ролей
   * 
   * curl http://localhost:8001/api/admin/roles
   */
  @Get('roles')
  async getAvailableRoles() {
    this.loggerService.info('Admin: Getting available roles');

    try {
      const roles = await this.keycloakRoleService.getAvailableRoles();

      this.loggerService.info('Admin: Roles retrieved successfully', {
        count: roles.length,
      });

      return {
        success: true,
        data: roles,
      };
    } catch (error) {
      this.loggerService.error('Admin: Failed to get roles', error);
      throw error;
    }
  }

  /**
   * GET /api/admin/users/:id/roles
   * Получить роли пользователя
   * 
   * curl http://localhost:8001/api/admin/users/b2e22c9c-27bd-4fae-b29f-508d32a4dea9/roles
   */
  @Get('users/:id/roles')
  async getUserRoles(@Param('id') id: string) {
    this.loggerService.info('Admin: Getting user roles', { userId: id });

    try {
      const roles = await this.keycloakRoleService.getUserRoles(id);

      this.loggerService.info('Admin: User roles retrieved successfully', {
        userId: id,
        count: roles.length,
      });

      return {
        success: true,
        data: roles,
      };
    } catch (error) {
      this.loggerService.error('Admin: Failed to get user roles', error, { userId: id });
      throw error;
    }
  }

  /**
   * POST /api/admin/users/:id/roles
   * Назначить роль пользователю
   * 
   * curl -X POST http://localhost:8001/api/admin/users/b2e22c9c-27bd-4fae-b29f-508d32a4dea9/roles \
   *   -H "Content-Type: application/json" \
   *   -d '{"roleName":"admin"}'
   */
  @Post('users/:id/roles')
  async assignRole(
    @Param('id') id: string,
    @Body() body: { roleName: string },
  ) {
    this.loggerService.info('Admin: Assigning role via Saga', {
      userId: id,
      roleName: body.roleName,
    });

    // Execute Saga orchestration
    const result = await this.userOrchestrationSaga.executeAssignRole(id, body.roleName);

    return result;
  }

  /**
   * DELETE /api/admin/users/:id/roles/:roleName
   * Удалить роль у пользователя
   * 
   * curl -X DELETE http://localhost:8001/api/admin/users/b2e22c9c-27bd-4fae-b29f-508d32a4dea9/roles/admin
   */
  @Delete('users/:id/roles/:roleName')
  async removeRole(
    @Param('id') id: string,
    @Param('roleName') roleName: string,
  ) {
    this.loggerService.info('Admin: Removing role via Saga', {
      userId: id,
      roleName,
    });

    // Execute Saga orchestration
    const result = await this.userOrchestrationSaga.executeRemoveRole(id, roleName);

    return result;
  }

  /**
   * POST /api/admin/users/:id/suspend
   * Suspend user (synchronous via Keycloak)
   * 
   * curl -X POST http://localhost:8001/api/admin/users/b2e22c9c-27bd-4fae-b29f-508d32a4dea9/suspend
   */
  @Post('users/:id/suspend')
  async suspendUser(@Param('id') id: string) {
    this.loggerService.info('Admin: Suspending user', { userId: id });

    try {
      // Directly disable user in Keycloak (synchronous)
      await this.keycloakUserService.updateUser(id, { enabled: false });

      this.loggerService.info('Admin: User suspended successfully in Keycloak', { userId: id });

      return {
        success: true,
        message: 'User suspended successfully',
      };
    } catch (error) {
      this.loggerService.error('Admin: Failed to suspend user', error, { userId: id });
      throw error;
    }
  }

  /**
   * POST /api/admin/users/:id/activate
   * Activate user (synchronous via Keycloak)
   * 
   * curl -X POST http://localhost:8001/api/admin/users/b2e22c9c-27bd-4fae-b29f-508d32a4dea9/activate
   */
  @Post('users/:id/activate')
  async activateUser(@Param('id') id: string) {
    this.loggerService.info('Admin: Activating user', { userId: id });

    try {
      // Directly enable user in Keycloak (synchronous)
      await this.keycloakUserService.updateUser(id, { enabled: true });

      this.loggerService.info('Admin: User activated successfully in Keycloak', { userId: id });

      return {
        success: true,
        message: 'User activated successfully',
      };
    } catch (error) {
      this.loggerService.error('Admin: Failed to activate user', error, { userId: id });
      throw error;
    }
  }

  /**
   * POST /api/admin/users/:id/verify-email
   * Верифицирует email пользователя в Keycloak
   * 
   * curl -X POST http://localhost:8001/api/admin/users/b2e22c9c-27bd-4fae-b29f-508d32a4dea9/verify-email
   */
  @Post('users/:id/verify-email')
  async verifyEmail(@Param('id') id: string) {
    this.loggerService.info('Admin: Verifying email for user', { userId: id });

    try {
      await this.keycloakEmailService.verifyEmail(id);

      this.loggerService.info('Admin: Email verified successfully', { userId: id });

      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      this.loggerService.error('Admin: Failed to verify email', error, { userId: id });
      throw error;
    }
  }
}
