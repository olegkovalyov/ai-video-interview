import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator for role-based access control
 * @param roles - Array of required roles
 * 
 * @example
 * @Roles('admin')
 * @Roles('admin', 'hr')
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
