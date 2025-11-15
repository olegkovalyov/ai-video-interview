import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { KeycloakRoleService } from '../keycloak';
import { LoggerService } from '../../../../core/logging/logger.service';
import { UserOrchestrationSaga } from '../user-orchestration.saga';
import { AssignRoleDto, RolesListResponseDto, UserRolesResponseDto } from '../../dto/admin-user.dto';

/**
 * Admin Roles Controller
 * Handles role management operations
 * 
 * Endpoints:
 * - GET    /api/admin/roles                  - Get available roles
 * - GET    /api/admin/users/:id/roles        - Get user roles
 * - POST   /api/admin/users/:id/roles        - Assign role
 * - DELETE /api/admin/users/:id/roles/:name  - Remove role
 */
@ApiTags('Admin - Roles')
@ApiBearerAuth()
@Controller('api/admin')
export class AdminRolesController {
  constructor(
    private readonly keycloakRoleService: KeycloakRoleService,
    private readonly loggerService: LoggerService,
    private readonly userOrchestrationSaga: UserOrchestrationSaga,
  ) {}

  /**
   * GET /api/admin/roles
   * Получить список доступных ролей
   * 
   * curl http://localhost:8001/api/admin/roles
   */
  @Get('roles')
  @ApiOperation({ 
    summary: 'Get available roles',
    description: 'Returns list of all available roles in the system (candidate, hr, admin, pending)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Roles list retrieved successfully',
    type: RolesListResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ 
    summary: 'Get user roles',
    description: 'Returns list of roles assigned to the user'
  })
  @ApiParam({ name: 'id', description: 'Keycloak user ID (UUID)' })
  @ApiResponse({ 
    status: 200, 
    description: 'User roles retrieved successfully',
    type: UserRolesResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
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
  @ApiOperation({ 
    summary: 'Assign role to user',
    description: 'Assigns a role to user via Saga Orchestration (Keycloak + User Service). Removes pending role if present.'
  })
  @ApiParam({ name: 'id', description: 'Keycloak user ID (UUID)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Role assigned successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid role name' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async assignRole(
    @Param('id') id: string,
    @Body() body: AssignRoleDto,
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
   * @deprecated DELETE /api/admin/users/:id/roles/:roleName
   * Remove role operation is NOT SUPPORTED
   * 
   * User Service does not provide role removal endpoint.
   * To change a user's role, use POST /api/admin/users/:id/roles with the new role.
   * 
   * This endpoint is kept for backward compatibility but returns 501 Not Implemented.
   */
  @Delete('users/:id/roles/:roleName')
  @ApiOperation({ 
    summary: 'Remove role from user (DEPRECATED)',
    description: 'This endpoint is NOT SUPPORTED. To change user role, use POST /api/admin/users/:id/roles with the new role.',
    deprecated: true
  })
  @ApiParam({ name: 'id', description: 'Keycloak user ID (UUID)' })
  @ApiParam({ name: 'roleName', description: 'Role name to remove' })
  @ApiResponse({ 
    status: 501, 
    description: 'Not Implemented - Role removal is not supported'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeRole(
    @Param('id') id: string,
    @Param('roleName') roleName: string,
  ) {
    this.loggerService.warn('Admin: Role removal not supported', {
      userId: id,
      roleName,
    });

    // Role removal is not supported by User Service
    // Use role assignment to change roles instead
    const result = await this.userOrchestrationSaga.executeRemoveRole(id, roleName);

    return result;
  }
}
