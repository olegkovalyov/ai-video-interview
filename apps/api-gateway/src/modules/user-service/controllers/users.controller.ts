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
      const user = await this.userServiceClient.getUserByIdInternal(userId);
      
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
      const user = await this.userServiceClient.updateUserProfileInternal(userId, updates);
      
      this.loggerService.log(`✅ [API Gateway] User profile updated: userId=${user.id}`);
      
      return user;
    } catch (error) {
      this.loggerService.error('Failed to update user profile', error);
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
