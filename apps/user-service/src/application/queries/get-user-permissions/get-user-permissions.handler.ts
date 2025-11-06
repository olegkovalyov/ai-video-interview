import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserPermissionsQuery } from './get-user-permissions.query';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import type { IUserReadRepository } from '../../../domain/repositories/user-read.repository.interface';

/**
 * User Permissions Result
 */
export interface UserPermissionsResult {
  userId: string;
  roles: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  permissions: string[];
}

/**
 * Get User Permissions Query Handler
 */
@QueryHandler(GetUserPermissionsQuery)
export class GetUserPermissionsHandler implements IQueryHandler<GetUserPermissionsQuery> {
  constructor(
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetUserPermissionsQuery): Promise<UserPermissionsResult> {
    // 1. Verify user exists
    const user = await this.userReadRepository.findById(query.userId);
    if (!user) {
      throw new UserNotFoundException(query.userId);
    }

    // 2. Get user role (new single role system)
    const roleName = user.role.value;
    
    // 3. Map role to basic permissions
    // NOTE: In new system, we use simple role-based access
    // No complex permission aggregation needed
    const permissions = this.getPermissionsForRole(roleName);

    return {
      userId: query.userId,
      roles: [{
        id: roleName, // Use role name as ID in new system
        name: roleName,
        displayName: user.role.getDisplayName(),
      }],
      permissions,
    };
  }

  private getPermissionsForRole(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      'pending': ['read:own_profile'],
      'candidate': [
        'read:own_profile',
        'write:own_profile',
        'read:interviews',
        'write:interviews',
      ],
      'hr': [
        'read:own_profile',
        'write:own_profile',
        'read:candidates',
        'create:interviews',
        'manage:interviews',
      ],
      'admin': [
        'read:users',
        'write:users',
        'delete:users',
        'manage:roles',
        'manage:system',
      ],
    };

    return rolePermissions[role] || [];
  }
}
