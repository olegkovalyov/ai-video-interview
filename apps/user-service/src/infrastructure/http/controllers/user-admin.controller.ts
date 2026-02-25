import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiBody } from '@nestjs/swagger';

// Commands
import { SuspendUserCommand } from '../../../application/commands/suspend-user/suspend-user.command';
import { ActivateUserCommand } from '../../../application/commands/activate-user/activate-user.command';

// Queries
import { GetUserQuery } from '../../../application/queries/get-user/get-user.query';

// DTOs
import { SuspendUserDto } from '../../../application/dto/requests/suspend-user.dto';
import { UserResponseDto } from '../../../application/dto/responses/user.response.dto';

// Guards
import { InternalServiceGuard } from '../guards/internal-service.guard';
import { Public } from '../decorators/public.decorator';

// Error Schemas
import {
  BadRequestErrorSchema,
  UnauthorizedErrorSchema,
  NotFoundErrorSchema,
  InternalServerErrorSchema,
} from '../schemas/error.schemas';

/**
 * User Admin Controller
 * 
 * Handles administrative actions on users:
 * - Suspend user (with reason)
 * - Activate user (restore from suspension)
 * 
 * These are non-CRUD operations that represent admin actions.
 * All endpoints are internal (service-to-service) and protected by internal token.
 * 
 * Note: User deletion is handled in UsersController as it's a CRUD operation (DELETE).
 */
@ApiTags('user-admin')
@Controller('users/:userId')
@ApiSecurity('internal-token')
@UseGuards(InternalServiceGuard)
@Public()
export class UserAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ============================================
  // Admin Actions
  // ============================================

  /**
   * POST /users/:userId/suspend
   * Suspend user account (admin action)
   * 
   * Suspended users cannot log in or perform any actions.
   * A reason must be provided for audit purposes.
   */
  @Post('suspend')
  @HttpCode(200)
  @ApiOperation({ summary: 'Suspend user (Admin action)' })
  @ApiBody({ type: SuspendUserDto })
  @ApiResponse({ status: 200, type: UserResponseDto, description: 'User suspended successfully' })
  @ApiResponse({ status: 400, type: BadRequestErrorSchema, description: 'Validation error (missing reason)' })
  @ApiResponse({ status: 401, type: UnauthorizedErrorSchema, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, type: NotFoundErrorSchema, description: 'User not found' })
  @ApiResponse({ status: 410, description: 'User is deleted' })
  @ApiResponse({ status: 422, description: 'Invalid operation on user in current state (e.g. already suspended)' })
  async suspendUser(
    @Param('userId') userId: string,
    @Body() dto: SuspendUserDto,
  ): Promise<UserResponseDto> {
    // Note: suspendedBy should come from auth context (x-user-id header)
    // For now, we use 'admin' as a placeholder
    const suspendedBy = 'admin'; // TODO: Get from request headers

    // Execute command (suspends the user)
    // Domain exceptions propagate to DomainExceptionFilter for proper HTTP mapping
    await this.commandBus.execute(
      new SuspendUserCommand(userId, dto.reason, suspendedBy),
    );

    // Query updated user (returns Read Model)
    const user = await this.queryBus.execute(new GetUserQuery(userId));
    return UserResponseDto.fromDomain(user);
  }

  /**
   * POST /users/:userId/activate
   * Activate user account (admin action)
   * 
   * Restores a suspended user account to active status.
   * User will be able to log in and perform actions again.
   */
  @Post('activate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Activate user (Admin action)' })
  @ApiResponse({ status: 200, type: UserResponseDto, description: 'User activated successfully' })
  @ApiResponse({ status: 401, type: UnauthorizedErrorSchema, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, type: NotFoundErrorSchema, description: 'User not found' })
  @ApiResponse({ status: 410, description: 'User is deleted' })
  async activateUser(
    @Param('userId') userId: string,
  ): Promise<UserResponseDto> {
    // Execute command (activates the user)
    // Domain exceptions propagate to DomainExceptionFilter for proper HTTP mapping
    await this.commandBus.execute(
      new ActivateUserCommand(userId),
    );

    // Query updated user (returns Read Model)
    const user = await this.queryBus.execute(new GetUserQuery(userId));
    return UserResponseDto.fromDomain(user);
  }
}
