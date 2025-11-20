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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { UserServiceClient } from '../clients/user-service.client';
import { LoggerService } from '../../../core/logging/logger.service';
import { KeycloakRoleService } from '../admin/keycloak';
import { UpdateProfileDto, SelectRoleDto, UserProfileResponseDto } from '../dto/user-profile.dto';

/**
 * Users Controller
 * Proxies requests to User Service
 */
@ApiTags('Users')
@ApiBearerAuth()
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
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Returns the profile of the currently authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'User not found' })
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
  @ApiOperation({ 
    summary: 'Update current user profile',
    description: 'Updates the profile of the currently authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile updated successfully',
    type: UserProfileResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateCurrentUser(@Req() req: Request & { user?: any }, @Body() updates: UpdateProfileDto) {
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
  @ApiOperation({ 
    summary: 'Select user role',
    description: 'User selects their role (candidate/hr/admin). One-time operation after registration. Updates both Keycloak and User Service.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Role selected successfully. User will receive new JWT on next login.'
  })
  @ApiResponse({ status: 400, description: 'Invalid role or role already selected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async selectRole(@Req() req: Request & { user?: any }, @Body() body: SelectRoleDto) {
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

  /**
   * PUT /api/users/me/experience-level
   * Update current user experience level (Candidate only)
   */
  @Put('me/experience-level')
  @ApiOperation({ 
    summary: 'Update my experience level',
    description: 'Updates the experience level of the current user (junior, mid, senior, lead). Candidate only.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Experience level updated successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid experience level' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Candidate profile not found' })
  async updateExperienceLevel(
    @Req() req: Request & { user?: any }, 
    @Body() body: { experienceLevel: 'junior' | 'mid' | 'senior' | 'lead' }
  ) {
    const userId = req.user?.userId;
    
    if (!userId) {
      this.loggerService.error('PUT /users/me/experience-level - userId missing in req.user', {
        user: req.user,
      });
      throw new Error('User ID not found in request');
    }
    
    this.loggerService.info(`📝 [API Gateway] PUT /users/me/experience-level - userId: ${userId}, level: ${body.experienceLevel}`);

    try {
      const result = await this.userServiceClient.updateExperienceLevel(userId, body.experienceLevel);
      
      this.loggerService.log(`✅ [API Gateway] Experience level updated: userId=${userId}, level=${body.experienceLevel}`);
      
      return result;
    } catch (error) {
      this.loggerService.error('Failed to update experience level', error);
      throw error;
    }
  }

  /**
   * GET /api/users/me/permissions
   * Get current user permissions
   */
  @Get('me/permissions')
  @ApiOperation({ 
    summary: 'Get my permissions',
    description: 'Retrieves roles and permissions for the current user based on their assigned role.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Permissions retrieved successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMyPermissions(@Req() req: Request & { user?: any }) {
    const userId = req.user?.userId;
    
    if (!userId) {
      this.loggerService.error('GET /users/me/permissions - userId missing in req.user', {
        user: req.user,
      });
      throw new Error('User ID not found in request');
    }
    
    this.loggerService.log(`📡 [API Gateway] GET /users/me/permissions - userId: ${userId}`);

    try {
      const permissions = await this.userServiceClient.getUserPermissions(userId);
      
      this.loggerService.log(`✅ [API Gateway] Permissions retrieved: userId=${userId}`);
      
      return permissions;
    } catch (error) {
      this.loggerService.error('Failed to fetch user permissions', error);
      throw error;
    }
  }

  /**
   * GET /api/users/me/companies
   * Get current user companies (HR only)
   */
  @Get('me/companies')
  @ApiOperation({ 
    summary: 'Get my companies',
    description: 'Retrieves all companies associated with the current user. Typically used by HR users.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Companies retrieved successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to view companies' })
  async getMyCompanies(@Req() req: Request & { user?: any }) {
    const userId = req.user?.userId;
    const isAdmin = req.user?.roles?.includes('admin') || false;
    
    if (!userId) {
      this.loggerService.error('GET /users/me/companies - userId missing in req.user', {
        user: req.user,
      });
      throw new Error('User ID not found in request');
    }
    
    this.loggerService.log(`📡 [API Gateway] GET /users/me/companies - userId: ${userId}, isAdmin: ${isAdmin}`);

    try {
      const companies = await this.userServiceClient.getUserCompanies(userId, userId, isAdmin);
      
      this.loggerService.log(`✅ [API Gateway] Companies retrieved: userId=${userId}, count=${companies.length}`);
      
      return companies;
    } catch (error) {
      this.loggerService.error('Failed to fetch user companies', error);
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
