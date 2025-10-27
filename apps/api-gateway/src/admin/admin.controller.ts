import { Controller, Post, Get, Put, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { KeycloakAdminService } from './keycloak-admin.service';
import { LoggerService } from '../logger/logger.service';
import { KafkaService, UserEventFactory, KAFKA_TOPICS } from '@repo/shared';

/**
 * Admin Controller
 * Управление пользователями через Keycloak Admin API + Kafka events
 * 
 * NOTE: Без auth guard для тестирования через curl
 * TODO: Добавить @UseGuards(JwtAuthGuard, RolesGuard) после тестов
 */
@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly keycloakAdminService: KeycloakAdminService,
    private readonly loggerService: LoggerService,
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
  ) {}

  /**
   * POST /api/admin/users
   * Создаёт нового пользователя в Keycloak
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
    this.loggerService.info('Admin: Creating user in Keycloak', {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
    });

    try {
      // Создаём пользователя в Keycloak
      const result = await this.keycloakAdminService.createUser({
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        password: body.password || 'password', // Default password
        enabled: true,
      });

      this.loggerService.info('Admin: User created successfully', {
        keycloakId: result.keycloakId,
        email: result.email,
      });

      // Публикуем событие в Kafka
      const event = UserEventFactory.createUserRegistered(
        result.keycloakId,
        result.email,
        {
          firstName: result.firstName,
          lastName: result.lastName,
          registrationMethod: 'oauth',
        },
      );

      await this.kafkaService.publishEvent(KAFKA_TOPICS.USER_EVENTS, event);

      this.loggerService.info('Admin: User created event published', {
        eventId: event.eventId,
        keycloakId: result.keycloakId,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.loggerService.error('Admin: Failed to create user', error, {
        email: body.email,
      });
      throw error;
    }
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
      const users = await this.keycloakAdminService.listUsers({
        search,
        max: max || 100,
        first: first || 0,
      });

      this.loggerService.info('Admin: Users listed successfully', {
        count: users.length,
      });

      return {
        success: true,
        data: users,
        count: users.length,
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
      const user = await this.keycloakAdminService.getUser(id);

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
    this.loggerService.info('Admin: Updating user', { userId: id, updates: body });

    try {
      await this.keycloakAdminService.updateUser(id, body);

      this.loggerService.info('Admin: User updated successfully', { userId: id });

      // Публикуем событие в Kafka
      const event = UserEventFactory.createUserProfileUpdated(
        id,
        Object.keys(body),
        {},
        body,
      );

      await this.kafkaService.publishEvent(KAFKA_TOPICS.USER_EVENTS, event);

      this.loggerService.info('Admin: User updated event published', {
        eventId: event.eventId,
        userId: id,
      });

      return {
        success: true,
        message: 'User updated successfully',
      };
    } catch (error) {
      this.loggerService.error('Admin: Failed to update user', error, { userId: id });
      throw error;
    }
  }

  /**
   * DELETE /api/admin/users/:id
   * Удалить пользователя
   * 
   * curl -X DELETE http://localhost:8001/api/admin/users/b2e22c9c-27bd-4fae-b29f-508d32a4dea9
   */
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    this.loggerService.info('Admin: Deleting user', { userId: id });

    try {
      await this.keycloakAdminService.deleteUser(id);

      this.loggerService.info('Admin: User deleted successfully', { userId: id });

      // Публикуем событие в Kafka
      const event = UserEventFactory.createUserDeleted(id, 'admin');

      await this.kafkaService.publishEvent(KAFKA_TOPICS.USER_EVENTS, event);

      this.loggerService.info('Admin: User deleted event published', {
        eventId: event.eventId,
        userId: id,
      });

      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      this.loggerService.error('Admin: Failed to delete user', error, { userId: id });
      throw error;
    }
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
      const roles = await this.keycloakAdminService.getAvailableRoles();

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
      const roles = await this.keycloakAdminService.getUserRoles(id);

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
    this.loggerService.info('Admin: Assigning role to user', {
      userId: id,
      roleName: body.roleName,
    });

    try {
      await this.keycloakAdminService.assignRole(id, body.roleName);

      this.loggerService.info('Admin: Role assigned successfully', {
        userId: id,
        roleName: body.roleName,
      });

      // Публикуем событие в Kafka
      const event = UserEventFactory.createUserRoleAssigned(id, body.roleName);

      await this.kafkaService.publishEvent(KAFKA_TOPICS.USER_EVENTS, event);

      this.loggerService.info('Admin: Role assigned event published', {
        eventId: event.eventId,
        userId: id,
        roleName: body.roleName,
      });

      return {
        success: true,
        message: `Role ${body.roleName} assigned successfully`,
      };
    } catch (error) {
      this.loggerService.error('Admin: Failed to assign role', error, {
        userId: id,
        roleName: body.roleName,
      });
      throw error;
    }
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
    this.loggerService.info('Admin: Removing role from user', {
      userId: id,
      roleName,
    });

    try {
      await this.keycloakAdminService.removeRole(id, roleName);

      this.loggerService.info('Admin: Role removed successfully', {
        userId: id,
        roleName,
      });

      // Публикуем событие в Kafka
      const event = UserEventFactory.createUserRoleRemoved(id, roleName);

      await this.kafkaService.publishEvent(KAFKA_TOPICS.USER_EVENTS, event);

      this.loggerService.info('Admin: Role removed event published', {
        eventId: event.eventId,
        userId: id,
        roleName,
      });

      return {
        success: true,
        message: `Role ${roleName} removed successfully`,
      };
    } catch (error) {
      this.loggerService.error('Admin: Failed to remove role', error, {
        userId: id,
        roleName,
      });
      throw error;
    }
  }
}
