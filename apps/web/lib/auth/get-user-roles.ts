import { cookies } from 'next/headers';
import { decodeJwtPayload, isTokenExpired } from './decode-jwt';

const TOKEN_REFRESH_BUFFER_SECONDS = 60;

/**
 * BULLETPROOF AUTH - Level 2 Server-Side Role Check
 *
 * Checks token expiration with auto-refresh.
 * Used in Server Components (layouts).
 */
export async function getUserRoles(): Promise<string[]> {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get('access_token')?.value;

    if (!token || isTokenExpired(token, TOKEN_REFRESH_BUFFER_SECONDS)) {
      const refreshToken = cookieStore.get('refresh_token')?.value;
      if (!refreshToken) return [];

      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh-server`, {
          method: 'POST',
          headers: { 'Cookie': `refresh_token=${refreshToken}` },
        });

        if (refreshResponse.ok) {
          const newCookieStore = await cookies();
          token = newCookieStore.get('access_token')?.value;
        } else {
          return [];
        }
      } catch {
        return [];
      }
    }

    if (!token) return [];

    const payload = decodeJwtPayload(token);
    return payload?.realm_access?.roles ?? [];
  } catch {
    return [];
  }
}

/**
 * Server-side: extract user info from JWT token.
 */
export async function getUserFromToken(): Promise<{
  name?: string;
  email?: string;
  roles: string[];
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;

    const payload = decodeJwtPayload(token);
    if (!payload) return null;

    return {
      name: payload.name as string | undefined,
      email: payload.email as string | undefined,
      roles: payload.realm_access?.roles ?? [],
    };
  } catch {
    return null;
  }
}
