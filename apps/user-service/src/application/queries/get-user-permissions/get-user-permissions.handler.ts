import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserPermissionsQuery } from './get-user-permissions.query';
import type { IRoleRepository } from '../../../domain/repositories/role.repository.interface';
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
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(query: GetUserPermissionsQuery): Promise<UserPermissionsResult> {
    // 1. Verify user exists
    const user = await this.userReadRepository.findById(query.userId);
    if (!user) {
      throw new UserNotFoundException(query.userId);
    }

    // 2. Get user roles
    const roles = await this.roleRepository.findByUserId(query.userId);

    // 3. Aggregate permissions from all roles
    const permissions = new Set<string>();
    roles.forEach(role => {
      role.permissions.forEach(permission => permissions.add(permission));
    });

    return {
      userId: query.userId,
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
      })),
      permissions: Array.from(permissions),
    };
  }
}
