import { Controller, Post, Param } from '@nestjs/common';
import { KeycloakUserService, KeycloakEmailService } from '../keycloak';
import { LoggerService } from '../../core/logging/logger.service';

/**
 * Admin Actions Controller
 * Handles user action operations (suspend, activate, verify email)
 * 
 * Endpoints:
 * - POST /api/admin/users/:id/suspend       - Suspend user
 * - POST /api/admin/users/:id/activate      - Activate user
 * - POST /api/admin/users/:id/verify-email  - Verify email
 * 
 * Note: These operations are synchronous and performed directly in Keycloak
 */
@Controller('api/admin/users')
export class AdminActionsController {
  constructor(
    private readonly keycloakUserService: KeycloakUserService,
    private readonly keycloakEmailService: KeycloakEmailService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * POST /api/admin/users/:id/suspend
   * Suspend user (synchronous via Keycloak)
   * 
   * curl -X POST http://localhost:8001/api/admin/users/b2e22c9c-27bd-4fae-b29f-508d32a4dea9/suspend
   */
  @Post(':id/suspend')
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
  @Post(':id/activate')
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
  @Post(':id/verify-email')
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
