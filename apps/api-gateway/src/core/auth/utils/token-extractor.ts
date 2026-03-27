/**
 * Extract Bearer token from Authorization header.
 * @param authHeader - The Authorization header value (e.g., "Bearer eyJ...")
 * @returns The token string, or null if not found/invalid
 */
export function extractBearerToken(authHeader: string): string | null {
  if (!authHeader) return null;
  const [type, value] = authHeader.split(' ');
  if (!type || type.toLowerCase() !== 'bearer' || !value) return null;
  return value;
}

/**
 * Extract a token from cookies by name.
 * @param cookieHeader - The raw Cookie header string
 * @param cookieName - The name of the cookie to extract (default: 'access_token')
 * @returns The decoded cookie value, or null if not found
 */
export function extractTokenFromCookies(
  cookieHeader: string,
  cookieName: string = 'access_token',
): string | null {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(';');
  for (const p of pairs) {
    const [rawKey, ...rest] = p.split('=');
    if (!rawKey || rest.length === 0) continue;
    const key = rawKey.trim();
    if (key !== cookieName) continue;
    const value = rest.join('=').trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}
