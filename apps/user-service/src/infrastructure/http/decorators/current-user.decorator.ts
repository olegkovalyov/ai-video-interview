import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Resolves the current user's internal ID from the request context.
 *
 * Prefers `userId` (our internal UUID) over `sub` (Keycloak subject) — older
 * tokens carry only `sub`, so we keep it as fallback. Throws if neither is
 * present: routes that reach this decorator must be authenticated.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const resolved = request.user?.userId ?? request.user?.sub;

    if (!resolved) {
      throw new UnauthorizedException('User identity missing from request');
    }

    return resolved;
  },
);
