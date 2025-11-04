import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { GetUserByExternalAuthIdQuery } from '../../../application/queries/get-user-by-external-auth-id/get-user-by-external-auth-id.query';
import { GetUserPermissionsQuery } from '../../../application/queries/get-user-permissions/get-user-permissions.query';
import { GetUserQuery } from '../../../application/queries/get-user/get-user.query';
import { CreateUserCommand } from '../../../application/commands/create-user/create-user.command';
import { UpdateUserCommand } from '../../../application/commands/update-user/update-user.command';
import { DeleteUserCommand } from '../../../application/commands/delete-user/delete-user.command';
import { CreateUserInternalDto } from '../../../application/dto/requests/create-user-internal.dto';
import { UpdateUserInternalDto } from '../../../application/dto/requests/update-user-internal.dto';
import { UserResponseDto } from '../../../application/dto/responses/user.response.dto';
import { UserPermissionsResponseDto } from '../../../application/dto/responses/user-permissions.response.dto';
import { InternalServiceGuard } from '../guards/internal-service.guard';
import { Public } from '../decorators/public.decorator';
import { UserAlreadyExistsException, UserNotFoundException } from '../../../domain/exceptions/user.exceptions';

/**
 * Internal Controller
 * Service-to-Service endpoints (protected by internal token)
 */
@ApiTags('internal')
@Controller('internal')
@ApiSecurity('internal-token')
@UseGuards(InternalServiceGuard)
@Public()
export class InternalController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user by ID (Internal)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(
    @Param('userId') userId: string,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.queryBus.execute(new GetUserQuery(userId));
      return UserResponseDto.fromDomain(user);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new NotFoundException({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }
      throw error;
    }
  }

  @Get('users/by-external-auth/:externalAuthId')
  @ApiOperation({ summary: 'Get user by external auth ID (Internal)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByExternalAuthId(
    @Param('externalAuthId') externalAuthId: string,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.queryBus.execute(
        new GetUserByExternalAuthIdQuery(externalAuthId),
      );
      return UserResponseDto.fromDomain(user);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new NotFoundException({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }
      throw error;
    }
  }

  @Get('users/:userId/permissions')
  @ApiOperation({ summary: 'Get user permissions (Internal)' })
  @ApiResponse({ status: 200, type: UserPermissionsResponseDto })
  async getUserPermissions(
    @Param('userId') userId: string,
  ): Promise<UserPermissionsResponseDto> {
    const result = await this.queryBus.execute(
      new GetUserPermissionsQuery(userId),
    );
    
    return {
      userId: result.userId,
      roles: result.roles,
      permissions: result.permissions,
    };
  }

  /**
   * POST /internal/users
   * Create user (called by API Gateway via Saga)
   */
  @Post('users')
  @ApiOperation({ summary: 'Create user (Internal - Saga)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body() dto: CreateUserInternalDto) {
    try {
      const user = await this.commandBus.execute(
        new CreateUserCommand(
          dto.userId,
          dto.externalAuthId,
          dto.email,
          dto.firstName,
          dto.lastName,
        ),
      );

      return {
        success: true,
        data: {
          userId: user.id,
          email: user.email.value,
          firstName: user.fullName.firstName,
          lastName: user.fullName.lastName,
          status: user.status.value,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      if (error instanceof UserAlreadyExistsException) {
        throw new ConflictException({
          success: false,
          error: 'User already exists',
          code: 'USER_ALREADY_EXISTS',
          details: error.message,
        });
      }

      throw new InternalServerErrorException({
        success: false,
        error: 'Failed to create user',
        details: error.message,
      });
    }
  }

  /**
   * PUT /internal/users/:id
   * Update user (called by API Gateway)
   */
  @Put('users/:id')
  @ApiOperation({ summary: 'Update user profile (Internal)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') userId: string,
    @Body() dto: UpdateUserInternalDto,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.commandBus.execute(
        new UpdateUserCommand(
          userId,
          dto.firstName,
          dto.lastName,
          dto.bio,
          dto.phone,
          dto.timezone,
          dto.language,
        ),
      );

      return UserResponseDto.fromDomain(user);
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
        error: 'Failed to update user',
        details: error.message,
      });
    }
  }

  /**
   * DELETE /internal/users/:id
   * Delete user (called by API Gateway via Saga)
   */
  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (Internal - Saga)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') userId: string) {
    try {
      await this.commandBus.execute(new DeleteUserCommand(userId, 'system'));

      return {
        success: true,
        message: 'User deleted successfully',
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
        error: 'Failed to delete user',
        details: error.message,
      });
    }
  }

  /**
   * POST /internal/users/:userId/select-role
   * Internal endpoint to assign role (for admin/testing)
   */
  @Post('users/:userId/select-role')
  @ApiOperation({ summary: 'Assign role to user (Internal)' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async selectRoleInternal(
    @Param('userId') userId: string,
    @Body() dto: { role: string },
  ) {
    try {
      const { SelectRoleCommand } = await import('../../../application/commands/select-role/select-role.command.js');
      
      await this.commandBus.execute(
        new SelectRoleCommand(userId, dto.role as 'candidate' | 'hr' | 'admin'),
      );

      return {
        success: true,
        message: `Role ${dto.role} assigned successfully`,
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
        error: 'Failed to assign role',
        details: error.message,
      });
    }
  }
}
