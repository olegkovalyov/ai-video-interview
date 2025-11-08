import { cookies } from 'next/headers';

/**
 * BULLETPROOF AUTH - Level 2 Server-Side Role Check
 * 
 * Проверяет expiration токена и делает auto-refresh если нужно
 * Используется в Server Components (layouts)
 */

/**
 * Проверяет истёк ли токен (с 1-минутным буфером)
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return true; // Invalid token format
    }
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const buffer = 60000; // 1 minute buffer - refresh before expiration
    
    return now >= (exp - buffer);
  } catch {
    return true; // Invalid token = expired
  }
}

/**
 * Server-side функция для получения ролей из JWT токена
 * С автоматическим refresh если токен истёк
 */
export async function getUserRoles(): Promise<string[]> {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get('access_token')?.value;
    
    // If token is expired or missing, try to refresh
    if (!token || isTokenExpired(token)) {
      const refreshToken = cookieStore.get('refresh_token')?.value;
      if (!refreshToken) {
        return [];
      }
      
      try {
        // Call our server-side refresh API route
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh-server`, {
          method: 'POST',
          headers: {
            'Cookie': `refresh_token=${refreshToken}`,
          },
        });
        
        if (refreshResponse.ok) {
          // Re-read cookies after refresh (cookies are updated by API Gateway)
          const newCookieStore = await cookies();
          token = newCookieStore.get('access_token')?.value;
        } else {
          return [];
        }
      } catch (refreshError) {
        console.error('[getUserRoles] ❌ Refresh error:', refreshError);
        return [];
      }
    }
    
    if (!token) {
      return [];
    }
    
    // Decode JWT payload (base64)
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return [];
    }
    const payload = JSON.parse(atob(parts[1]));
    
    return payload.realm_access?.roles || [];
  } catch (error) {
    console.error('[getUserRoles] Error:', error);
    return [];
  }
}

/**
 * Server-side функция для получения информации о пользователе из JWT
 */
export async function getUserFromToken(): Promise<{
  name?: string;
  email?: string;
  roles: string[];
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    
    if (!token) {
      return null;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }
    const payload = JSON.parse(atob(parts[1]));
    
    return {
      name: payload.name,
      email: payload.email,
      roles: payload.realm_access?.roles || [],
    };
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    return null;
  }
}
