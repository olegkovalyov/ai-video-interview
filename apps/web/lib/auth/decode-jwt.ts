/**
 * JWT payload interface for Keycloak tokens
 */
export interface JwtPayload {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  realm_access?: {
    roles: string[];
  };
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

const APP_ROLES = ['admin', 'hr', 'candidate', 'pending'] as const;
export type AppRole = (typeof APP_ROLES)[number];

/**
 * Decode JWT payload without verification (for client-side role extraction only).
 * Returns null if token is malformed.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    return JSON.parse(atob(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extract application-specific roles from JWT payload.
 * Filters out Keycloak internal roles.
 */
export function extractAppRoles(payload: JwtPayload): string[] {
  const roles = payload.realm_access?.roles ?? [];
  return roles.filter((r): r is string => APP_ROLES.includes(r as AppRole));
}

/**
 * Check if token is expired (with optional buffer in seconds).
 */
export function isTokenExpired(token: string, bufferSeconds = 0): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  const expiresAtMs = payload.exp * 1000;
  return Date.now() >= expiresAtMs - bufferSeconds * 1000;
}

/**
 * Check if roles include only 'pending' (no real role assigned yet).
 */
export function isPendingOnly(roles: string[]): boolean {
  const hasRealRole = roles.some(r => ['admin', 'hr', 'candidate'].includes(r));
  return roles.includes('pending') && !hasRealRole;
}
