import { cookies } from 'next/headers';

/**
 * Server-side функция для получения ролей из JWT токена
 * Используется только в Server Components
 */
export async function getUserRoles(): Promise<string[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    
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
    console.error('Failed to parse JWT token:', error);
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
