import {
  Controller,
  Get,
  Put,
  Post,
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
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// Commands
import { UpdateUserCommand } from '../../../application/commands/update-user/update-user.command';
import { SuspendUserCommand } from '../../../application/commands/suspend-user/suspend-user.command';
import { ActivateUserCommand } from '../../../application/commands/activate-user/activate-user.command';
import { DeleteUserCommand } from '../../../application/commands/delete-user/delete-user.command';
import { UploadAvatarCommand } from '../../../application/commands/upload-avatar/upload-avatar.command';

// Queries
import { GetUserQuery } from '../../../application/queries/get-user/get-user.query';
import { GetUserByExternalAuthIdQuery } from '../../../application/queries/get-user-by-external-auth-id/get-user-by-external-auth-id.query';
import { ListUsersQuery } from '../../../application/queries/list-users/list-users.query';

// DTOs
import { UpdateUserDto } from '../../../application/dto/requests/update-user.dto';
import { ListUsersDto } from '../../../application/dto/requests/list-users.dto';
import { SuspendUserDto } from '../../../application/dto/requests/suspend-user.dto';
import { UserResponseDto } from '../../../application/dto/responses/user.response.dto';
import { UserListResponseDto } from '../../../application/dto/responses/user-list.response.dto';

// Guards & Decorators
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

/**
 * Users Controller
 * Handles user management endpoints
 */
@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Helper: resolve userId from JWT (can be either internal userId or externalAuthId)
   * Returns the internal userId
   * 
   * @deprecated This is a temporary workaround for JWT that doesn't contain userId.
   * Used only for avatar endpoints. Profile endpoints moved to internal API.
   */
  private async resolveUserId(userIdOrSub: string): Promise<string> {
    this.logger.log(`📍 [User Service] resolveUserId - input: ${userIdOrSub}`);
    try {
      // Try as internal userId first
      const user = await this.queryBus.execute(new GetUserQuery(userIdOrSub));
      this.logger.log(`📍 [User Service] Found by userId: ${user.id}, email: ${user.email.value}`);
      return user.id;
    } catch (error) {
      // If not found, try as externalAuthId
      this.logger.log(`📍 [User Service] Not found by userId, trying externalAuthId: ${userIdOrSub}`);
      const user = await this.queryBus.execute(new GetUserByExternalAuthIdQuery(userIdOrSub));
      this.logger.log(`📍 [User Service] Found by externalAuthId: ${user.id}, email: ${user.email.value}`);
      return user.id;
    }
  }

  // ========================================
  // CURRENT USER ENDPOINTS (Avatar only)
  // Note: Profile endpoints (GET/PUT /users/me) moved to Internal API
  // ========================================

  @Post('me/avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser() userIdOrSub: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: any,
  ): Promise<{ avatarUrl: string }> {
    const userId = await this.resolveUserId(userIdOrSub);
    const command = new UploadAvatarCommand(userId, file);
    const user = await this.commandBus.execute(command);
    
    return { avatarUrl: user.avatarUrl };
  }

  @Delete('me/avatar')
  @ApiOperation({ summary: 'Delete user avatar' })
  @ApiResponse({ status: 204, description: 'Avatar deleted successfully' })
  async deleteAvatar(@CurrentUser() userIdOrSub: string): Promise<void> {
    const userId = await this.resolveUserId(userIdOrSub);
    const command = new UpdateUserCommand(userId, undefined, undefined, undefined, undefined);
    await this.commandBus.execute(command);
  }

  // ========================================
  // ADMIN ENDPOINTS
  // ========================================

  @Get()
  @UseGuards(RolesGuard)
  @Roles('Admin', 'HR')
  @ApiOperation({ summary: 'List all users (Admin/HR only)' })
  @ApiResponse({ status: 200, type: UserListResponseDto })
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

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'HR')
  @ApiOperation({ summary: 'Get user by ID (Admin/HR only)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getUser(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.queryBus.execute(new GetUserQuery(id));
    return UserResponseDto.fromDomain(user);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() adminId: string,
  ): Promise<UserResponseDto> {
    const command = new UpdateUserCommand(
      id,
      dto.firstName,
      dto.lastName,
      dto.bio,
      dto.phone,
    );

    const user = await this.commandBus.execute(command);
    return UserResponseDto.fromDomain(user);
  }

  @Post(':id/suspend')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Suspend user (Admin only)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async suspendUser(
    @Param('id') id: string,
    @Body() dto: SuspendUserDto,
    @CurrentUser() adminId: string,
  ): Promise<UserResponseDto> {
    const command = new SuspendUserCommand(id, dto.reason, adminId);
    const user = await this.commandBus.execute(command);
    return UserResponseDto.fromDomain(user);
  }

  @Post(':id/activate')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Activate user (Admin only)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async activateUser(@Param('id') id: string): Promise<UserResponseDto> {
    const command = new ActivateUserCommand(id);
    const user = await this.commandBus.execute(command);
    return UserResponseDto.fromDomain(user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() adminId: string,
  ): Promise<void> {
    const command = new DeleteUserCommand(id, adminId);
    await this.commandBus.execute(command);
  }
}
