import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  userId: string;
  sub: string; // keycloakId
  email: string;
  given_name?: string;
  family_name?: string;
  roles?: string[];
  realm_access?: {
    roles: string[];
  };
}

/**
 * CurrentUser Decorator
 * Extracts authenticated user from request.user (set by JwtAuthGuard)
 * 
 * Usage:
 * @Get()
 * async method(@CurrentUser() user: CurrentUserData) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Helper to extract primary role from JWT payload
 * Priority: admin > hr > candidate > pending
 */
export function extractPrimaryRole(user: CurrentUserData): string {
  const roles = user.realm_access?.roles || user.roles || [];
  
  // Priority order
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('hr')) return 'hr';
  if (roles.includes('candidate')) return 'candidate';
  if (roles.includes('pending')) return 'pending';
  
  return 'pending'; // default fallback
}
