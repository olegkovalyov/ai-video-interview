import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { UserServiceClient } from '../clients/user-service.client';
import { LoggerService } from '../../../core/logging/logger.service';
import { KeycloakRoleService } from '../admin/keycloak';

/**
 * Users Controller
 * Proxies requests to User Service
 */
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly userServiceClient: UserServiceClient,
    private readonly loggerService: LoggerService,
    private readonly keycloakRoleService: KeycloakRoleService,
  ) {}

  /**
   * GET /api/users/me
   * Получить профиль текущего пользователя
   * Uses INTERNAL endpoint (not JWT proxy)
   */
  @Get('me')
  async getCurrentUser(@Req() req: Request & { user?: any }) {
    const userId = req.user?.userId;
    
    if (!userId) {
      this.loggerService.error('GET /users/me - userId missing in req.user', {
        user: req.user,
      });
      throw new Error('User ID not found in request');
    }
    
    this.loggerService.log(`📡 [API Gateway] GET /users/me - userId: ${userId}`);

    try {
      // Internal call to User Service using userId
      const user = await this.userServiceClient.getUserById(userId);
      
      this.loggerService.log(`✅ [API Gateway] Received from User Service: userId=${user.id}, email=${user.email}`);
      
      return user;
    } catch (error) {
      this.loggerService.error('Failed to fetch user profile', error);
      throw error;
    }
  }


  /**
   * PUT /api/users/me
   * Обновить профиль текущего пользователя
   * Uses INTERNAL endpoint (not JWT proxy)
   */
  @Put('me')
  async updateCurrentUser(@Req() req: Request & { user?: any }, @Body() updates: any) {
    const userId = req.user?.userId;
    
    if (!userId) {
      this.loggerService.error('PUT /users/me - userId missing in req.user', {
        user: req.user,
      });
      throw new Error('User ID not found in request');
    }
    
    this.loggerService.info(`📝 [API Gateway] PUT /users/me - userId: ${userId}`);

    try {
      // Internal call to User Service using userId
      const user = await this.userServiceClient.updateUser(userId, updates);
      
      this.loggerService.log(`✅ [API Gateway] User profile updated: userId=${user.id}`);
      
      return user;
    } catch (error) {
      this.loggerService.error('Failed to update user profile', error);
      throw error;
    }
  }

  /**
   * POST /api/users/me/select-role
   * User selects their role (candidate/hr)
   * One-time operation
   * Updates role in both Keycloak and User Service
   */
  @Post('me/select-role')
  async selectRole(@Req() req: Request & { user?: any }, @Body() body: { role: string }) {
    const userId = req.user?.userId;
    const keycloakId = req.user?.sub; // Keycloak user ID from JWT
    
    if (!userId) {
      this.loggerService.error('POST /users/me/select-role - userId missing in req.user', {
        user: req.user,
      });
      throw new Error('User ID not found in request');
    }

    if (!keycloakId) {
      this.loggerService.error('POST /users/me/select-role - keycloakId missing in req.user', {
        user: req.user,
      });
      throw new Error('Keycloak ID not found in request');
    }
    
    this.loggerService.info(`📝 [API Gateway] POST /users/me/select-role - userId: ${userId}, keycloakId: ${keycloakId}, role: ${body.role}`);

    try {
      // STEP 1: Remove pending role from Keycloak
      this.loggerService.info(`Step 1: Removing pending role from Keycloak`);
      try {
        await this.keycloakRoleService.removeRole(keycloakId, 'pending');
        this.loggerService.info(`Pending role removed from Keycloak`);
      } catch (removeError) {
        this.loggerService.warn(`Failed to remove pending role (might not exist): ${removeError.message}`);
        // Continue even if pending role removal fails (user might not have it)
      }

      // STEP 2: Assign new role in Keycloak (updates JWT token on next login)
      this.loggerService.info(`Step 2: Assigning role in Keycloak - ${body.role}`);
      await this.keycloakRoleService.assignRole(keycloakId, body.role);

      // STEP 3: Assign role in User Service (updates internal DB)
      this.loggerService.info(`Step 3: Assigning role in User Service - ${body.role}`);
      const result = await this.userServiceClient.assignRole(userId, { role: body.role as 'candidate' | 'hr' | 'admin' });
      
      this.loggerService.log(`✅ [API Gateway] Role selected successfully: userId=${userId}, keycloakId=${keycloakId}, role=${body.role}`);
      
      return result;
    } catch (error) {
      this.loggerService.error('Failed to select role', error);
      throw error;
    }
  }

  // TODO: Добавить остальные endpoints когда понадобятся:
  // - GET /api/users/me/stats
  // - POST /api/users/quota/reserve  
  // - GET /api/users (admin)
  // - GET /api/users/:id (admin)
  // - PUT /api/users/:id (admin)
  // - DELETE /api/users/:id (admin)
}
