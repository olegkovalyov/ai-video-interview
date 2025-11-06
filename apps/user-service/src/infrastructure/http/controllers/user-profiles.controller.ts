import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

// Commands
import { SelectRoleCommand } from '../../../application/commands/select-role/select-role.command';
import { UpdateCandidateProfileCommand } from '../../../application/commands/update-candidate-profile/update-candidate-profile.command';
import { UpdateHRProfileCommand } from '../../../application/commands/update-hr-profile/update-hr-profile.command';

// Queries
import { GetUserPermissionsQuery } from '../../../application/queries/get-user-permissions/get-user-permissions.query';

// DTOs
import { SelectRoleDto } from '../../../application/dto/requests/select-role.dto';
import { UpdateCandidateProfileDto } from '../../../application/dto/requests/update-candidate-profile.dto';
import { UpdateHRProfileDto } from '../../../application/dto/requests/update-hr-profile.dto';
import { UserPermissionsResponseDto } from '../../../application/dto/responses/user-permissions.response.dto';

// Guards & Exceptions
import { InternalServiceGuard } from '../guards/internal-service.guard';
import { Public } from '../decorators/public.decorator';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { DomainException } from '../../../domain/exceptions/domain.exception';

/**
 * User Profiles Controller
 * 
 * Handles:
 * - Role selection and assignment
 * - User permissions queries
 * - Candidate-specific profile updates
 * - HR-specific profile updates
 * 
 * All endpoints are internal (service-to-service) and protected by internal token.
 */
@ApiTags('user-profiles')
@Controller('users/:userId')
@ApiSecurity('internal-token')
@UseGuards(InternalServiceGuard)
@Public()
export class UserProfilesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ============================================
  // Roles & Permissions
  // ============================================

  /**
   * POST /users/:userId/roles
   * Assign role to user (candidate, hr, admin)
   * 
   * Note: Regular users can select role only once.
   * Admin role can only be assigned via internal endpoints.
   */
  @Post('roles')
  @HttpCode(200)
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role or role already assigned' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async assignRole(
    @Param('userId') userId: string,
    @Body() dto: SelectRoleDto,
  ): Promise<{ message: string; role: string }> {
    try {
      await this.commandBus.execute(
        new SelectRoleCommand(userId, dto.role as 'candidate' | 'hr' | 'admin'),
      );

      return {
        message: `Role ${dto.role} assigned successfully`,
        role: dto.role,
      };
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new NotFoundException({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      if (error instanceof DomainException) {
        throw new BadRequestException({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR',
        });
      }

      throw new InternalServerErrorException({
        success: false,
        error: 'Failed to assign role',
        details: error.message,
      });
    }
  }

  /**
   * GET /users/:userId/permissions
   * Get user permissions based on their roles
   */
  @Get('permissions')
  @ApiOperation({ summary: 'Get user permissions' })
  @ApiResponse({ status: 200, type: UserPermissionsResponseDto, description: 'User permissions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getUserPermissions(
    @Param('userId') userId: string,
  ): Promise<UserPermissionsResponseDto> {
    try {
      const result = await this.queryBus.execute(
        new GetUserPermissionsQuery(userId),
      );
      
      return {
        userId: result.userId,
        roles: result.roles,
        permissions: result.permissions,
      };
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new NotFoundException({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      throw new InternalServerErrorException({
        success: false,
        error: 'Failed to get user permissions',
        details: error.message,
      });
    }
  }

  // ============================================
  // Role-Specific Profiles
  // ============================================

  /**
   * PUT /users/:userId/profiles/candidate
   * Update candidate-specific profile (skills, experience level)
   */
  @Put('profiles/candidate')
  @ApiOperation({ summary: 'Update candidate profile' })
  @ApiResponse({ status: 200, description: 'Candidate profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body or user is not a candidate' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateCandidateProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateCandidateProfileDto,
  ): Promise<{ message: string }> {
    try {
      await this.commandBus.execute(
        new UpdateCandidateProfileCommand(
          userId,
          dto.skills,
          dto.experienceLevel,
        ),
      );

      return { message: 'Candidate profile updated successfully' };
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new NotFoundException({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      if (error instanceof DomainException) {
        throw new BadRequestException({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR',
        });
      }

      throw new InternalServerErrorException({
        success: false,
        error: 'Failed to update candidate profile',
        details: error.message,
      });
    }
  }

  /**
   * PUT /users/:userId/profiles/hr
   * Update HR-specific profile (company name, position)
   */
  @Put('profiles/hr')
  @ApiOperation({ summary: 'Update HR profile' })
  @ApiResponse({ status: 200, description: 'HR profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body or user is not an HR' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateHRProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateHRProfileDto,
  ): Promise<{ message: string }> {
    try {
      await this.commandBus.execute(
        new UpdateHRProfileCommand(
          userId,
          dto.companyName,
          dto.position,
        ),
      );

      return { message: 'HR profile updated successfully' };
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new NotFoundException({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      if (error instanceof DomainException) {
        throw new BadRequestException({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR',
        });
      }

      throw new InternalServerErrorException({
        success: false,
        error: 'Failed to update HR profile',
        details: error.message,
      });
    }
  }
}
