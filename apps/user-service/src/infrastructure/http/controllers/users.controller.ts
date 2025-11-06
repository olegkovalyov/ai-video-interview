import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiConsumes } from '@nestjs/swagger';

// Commands
import { CreateUserCommand } from '../../../application/commands/create-user/create-user.command';
import { UpdateUserCommand } from '../../../application/commands/update-user/update-user.command';
import { DeleteUserCommand } from '../../../application/commands/delete-user/delete-user.command';
import { UploadAvatarCommand } from '../../../application/commands/upload-avatar/upload-avatar.command';

// Queries
import { GetUserQuery } from '../../../application/queries/get-user/get-user.query';
import { GetUserByExternalAuthIdQuery } from '../../../application/queries/get-user-by-external-auth-id/get-user-by-external-auth-id.query';
import { ListUsersQuery } from '../../../application/queries/list-users/list-users.query';
import { GetUserStatsQuery } from '../../../application/queries/get-user-stats/get-user-stats.query';

// DTOs
import { CreateUserInternalDto } from '../../../application/dto/requests/create-user-internal.dto';
import { UpdateUserInternalDto } from '../../../application/dto/requests/update-user-internal.dto';
import { ListUsersDto } from '../../../application/dto/requests/list-users.dto';
import { UserResponseDto } from '../../../application/dto/responses/user.response.dto';
import { UserListResponseDto } from '../../../application/dto/responses/user-list.response.dto';
import { UserStatsResponseDto } from '../../../application/dto/responses/user-stats.response.dto';

// Guards & Exceptions
import { InternalServiceGuard } from '../guards/internal-service.guard';
import { Public } from '../decorators/public.decorator';
import { UserAlreadyExistsException, UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { DomainException } from '../../../domain/exceptions/domain.exception';

/**
 * Users Controller V2
 *
 * Handles:
 * - CRUD operations for users
 * - User queries (by ID, by external auth ID, list, stats)
 * - Avatar upload/delete operations
 *
 * All endpoints are internal (service-to-service) and protected by internal token.
 */
@ApiTags('users')
@Controller('users')
@ApiSecurity('internal-token')
@UseGuards(InternalServiceGuard)
@Public()
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ============================================
  // Query Operations
  // ============================================

  /**
   * GET /users
   * List users with pagination and filters
   */
  @Get()
  @ApiOperation({ summary: 'List users with pagination and filters' })
  @ApiResponse({ status: 200, type: UserListResponseDto, description: 'Users list retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async listUsers(@Query() dto: ListUsersDto): Promise<UserListResponseDto> {
    const query = new ListUsersQuery(
      dto.page || 1,
      dto.limit || 20,
      {
        search: dto.search,
        role: dto.role,
        status: dto.status,
      },
    );

    const result = await this.queryBus.execute(query);

    return {
      data: result.data.map(user => UserResponseDto.fromDomain(user)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * GET /users/stats
   * Get user statistics (total count, by role, by status)
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, type: UserStatsResponseDto, description: 'User statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getUserStats(): Promise<UserStatsResponseDto> {
    const result = await this.queryBus.execute(new GetUserStatsQuery());
    return result;
  }

  /**
   * GET /users/:userId
   * Get user by internal user ID
   */
  @Get(':userId')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto, description: 'User retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getUser(@Param('userId') userId: string): Promise<UserResponseDto> {
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

  /**
   * GET /users/by-external-auth/:externalAuthId
   * Get user by external authentication provider ID (e.g., Keycloak ID)
   */
  @Get('by-external-auth/:externalAuthId')
  @ApiOperation({ summary: 'Get user by external auth ID' })
  @ApiResponse({ status: 200, type: UserResponseDto, description: 'User retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getUserByExternalAuth(
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

  // ============================================
  // Command Operations (CRUD)
  // ============================================

  /**
   * POST /users
   * Create user (Saga operation from API Gateway)
   */
  @Post()
  @ApiOperation({ summary: 'Create user (Saga operation)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
   * PUT /users/:userId
   * Update user profile
   */
  @Put(':userId')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateUser(
    @Param('userId') userId: string,
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

      if (error instanceof DomainException) {
        throw new BadRequestException({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR',
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
   * DELETE /users/:userId
   * Delete user (Saga operation from API Gateway)
   */
  @Delete(':userId')
  @ApiOperation({ summary: 'Delete user (Saga operation)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteUser(@Param('userId') userId: string) {
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

  // ============================================
  // Avatar Operations
  // ============================================

  /**
   * POST /users/:userId/avatar
   * Upload user avatar (image file)
   */
  @Post(':userId/avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 413, description: 'File too large (max 5MB)' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('userId') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    try {
      const command = new UploadAvatarCommand(userId, file);
      const user = await this.commandBus.execute(command);

      return { avatarUrl: user.avatarUrl };
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
        error: 'Failed to upload avatar',
        details: error.message,
      });
    }
  }

  /**
   * DELETE /users/:userId/avatar
   * Delete user avatar
   */
  @Delete(':userId/avatar')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete user avatar' })
  @ApiResponse({ status: 204, description: 'Avatar deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteAvatar(@Param('userId') userId: string): Promise<void> {
    try {
      // Delete avatar by setting avatarUrl to undefined
      await this.commandBus.execute(
        new UpdateUserCommand(userId, undefined, undefined, undefined, undefined, undefined, undefined),
      );
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
        error: 'Failed to delete avatar',
        details: error.message,
      });
    }
  }
}
