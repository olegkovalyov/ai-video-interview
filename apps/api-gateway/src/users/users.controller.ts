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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserServiceClient } from '../clients';
import { LoggerService } from '../logger/logger.service';

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
   * ПРОСТО ПРОКСИРУЕТ запрос в User Service с JWT токеном
   */
  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    const authHeader = req.headers['authorization'];
    
    this.loggerService.info('Proxying GET /users/me to User Service');

    try {
      // Прямой проксированный вызов к User Service /users/me
      const user = await this.userServiceClient.getCurrentUserProfile(authHeader);
      return user;
    } catch (error) {
      this.loggerService.error('Failed to fetch user profile', error);
      throw error;
    }
  }

  /**
   * PUT /api/users/me
   * Обновить профиль текущего пользователя
   * ПРОСТО ПРОКСИРУЕТ запрос в User Service с JWT токеном
   */
  @Put('me')
  async updateCurrentUser(@Req() req: Request, @Body() updates: any) {
    const authHeader = req.headers['authorization'];
    
    this.loggerService.info('Proxying PUT /users/me to User Service');

    try {
      const user = await this.userServiceClient.updateCurrentUserProfile(authHeader, updates);
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
