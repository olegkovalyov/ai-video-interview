import type { Request } from 'express';

/**
 * Shape of the user claims attached by the API Gateway auth layer.
 *
 * `userId` is our internal UUID and is preferred; `sub` is Keycloak's subject
 * and is kept as a fallback for older tokens that predate the userId claim.
 */
export interface AuthenticatedUser {
  userId?: string;
  sub?: string;
  email?: string;
  roles?: string[];
}

/**
 * Express request after authentication middleware has populated `user`.
 *
 * Consumers must check `user` presence (or rely on a guard that throws on
 * missing auth) before using fields — the gateway may omit the claim on
 * public routes.
 */
export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};
