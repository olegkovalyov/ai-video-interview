import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { GetUserByKeycloakIdQuery } from '../../../application/queries/get-user-by-keycloak-id/get-user-by-keycloak-id.query';
import { GetUserPermissionsQuery } from '../../../application/queries/get-user-permissions/get-user-permissions.query';
import { UserResponseDto } from '../../../application/dto/responses/user.response.dto';
import { UserPermissionsResponseDto } from '../../../application/dto/responses/user-permissions.response.dto';
import { InternalServiceGuard } from '../guards/internal-service.guard';

/**
 * Internal Controller
 * Service-to-Service endpoints (protected by internal token)
 */
@ApiTags('internal')
@Controller('internal')
@ApiSecurity('internal-token')
@UseGuards(InternalServiceGuard)
export class InternalController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('users/by-keycloak/:keycloakId')
  @ApiOperation({ summary: 'Get user by Keycloak ID (Internal)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getUserByKeycloakId(
    @Param('keycloakId') keycloakId: string,
  ): Promise<UserResponseDto> {
    const user = await this.queryBus.execute(
      new GetUserByKeycloakIdQuery(keycloakId),
    );
    return UserResponseDto.fromDomain(user);
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
}
