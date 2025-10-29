import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 * Marks endpoint with required roles
 * Usage: @Roles('Admin', 'HR')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
