import { Controller, Post, Param, Body } from '@nestjs/common';
import { KeycloakUserService, KeycloakEmailService } from '../keycloak';
import { LoggerService } from '../../../../core/logging/logger.service';
import { UserServiceClient } from '../../clients/user-service.client';

/**
 * Admin Actions Controller
 * Handles user action operations (suspend, activate, verify email)
 * 
 * Endpoints:
 * - POST /api/admin/users/:id/suspend       - Suspend user (Keycloak + User Service)
 * - POST /api/admin/users/:id/activate      - Activate user (Keycloak + User Service)
 * - POST /api/admin/users/:id/verify-email  - Verify email (Keycloak only)
 * 
 * Note: Suspend/Activate are synchronized between Keycloak and User Service
 */
@Controller('api/admin/users')
export class AdminActionsController {
  constructor(
    private readonly keycloakUserService: KeycloakUserService,
    private readonly keycloakEmailService: KeycloakEmailService,
    private readonly userServiceClient: UserServiceClient,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * POST /api/admin/users/:id/suspend
   * Suspend user (Keycloak + User Service)
   * 
   * curl -X POST http://localhost:8001/api/admin/users/b2e22c9c-27bd-4fae-b29f-508d32a4dea9/suspend \
   *   -H "Content-Type: application/json" \
   *   -d '{"reason":"Policy violation"}'
   */
  @Post(':id/suspend')
  async suspendUser(
    @Param('id') keycloakId: string,
    @Body() body: { reason: string },
  ) {
    this.loggerService.info('Admin: Suspending user', { keycloakId, reason: body.reason });

    try {
      // STEP 1: Disable user in Keycloak
      await this.keycloakUserService.updateUser(keycloakId, { enabled: false });
      this.loggerService.info('Admin: User disabled in Keycloak', { keycloakId });

      // STEP 2: Get User Service userId
      const userServiceUser = await this.userServiceClient.getUserByExternalAuthId(keycloakId);
      
      if (userServiceUser) {
        // STEP 3: Suspend in User Service
        const result = await this.userServiceClient.suspendUser(userServiceUser.id, {
          reason: body.reason || 'Suspended by admin',
        });
        
        this.loggerService.info('Admin: User suspended in both systems', {
          keycloakId,
          userId: userServiceUser.id,
        });

        return {
          success: true,
          message: 'User suspended successfully',
          user: result,
        };
      } else {
        this.loggerService.warn('Admin: User not found in User Service, suspended only in Keycloak', {
          keycloakId,
        });
        
        return {
          success: true,
          message: 'User suspended in Keycloak only (not found in User Service)',
        };
      }
    } catch (error) {
      this.loggerService.error('Admin: Failed to suspend user', error, { keycloakId });
      throw error;
    }
  }

  /**
   * POST /api/admin/users/:id/activate
   * Activate user (Keycloak + User Service)
   * 
   * curl -X POST http://localhost:8001/api/admin/users/b2e22c9c-27bd-4fae-b29f-508d32a4dea9/activate
   */
  @Post(':id/activate')
  async activateUser(@Param('id') keycloakId: string) {
    this.loggerService.info('Admin: Activating user', { keycloakId });

    try {
      // STEP 1: Enable user in Keycloak
      await this.keycloakUserService.updateUser(keycloakId, { enabled: true });
      this.loggerService.info('Admin: User enabled in Keycloak', { keycloakId });

      // STEP 2: Get User Service userId
      const userServiceUser = await this.userServiceClient.getUserByExternalAuthId(keycloakId);
      
      if (userServiceUser) {
        // STEP 3: Activate in User Service
        const result = await this.userServiceClient.activateUser(userServiceUser.id);
        
        this.loggerService.info('Admin: User activated in both systems', {
          keycloakId,
          userId: userServiceUser.id,
        });

        return {
          success: true,
          message: 'User activated successfully',
          user: result,
        };
      } else {
        this.loggerService.warn('Admin: User not found in User Service, activated only in Keycloak', {
          keycloakId,
        });
        
        return {
          success: true,
          message: 'User activated in Keycloak only (not found in User Service)',
        };
      }
    } catch (error) {
      this.loggerService.error('Admin: Failed to activate user', error, { keycloakId });
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
