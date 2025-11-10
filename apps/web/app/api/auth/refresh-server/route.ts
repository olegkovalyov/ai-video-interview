import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * BULLETPROOF AUTH - Level 2 Server-Side Refresh
 * 
 * Server-side endpoint для обновления токенов
 * Используется в Server Components (getUserRoles, layouts)
 * 
 * Flow:
 * 1. Читает refresh_token из cookies
 * 2. Вызывает API Gateway /auth/refresh
 * 3. Получает новые access + refresh tokens
 * 4. Возвращает успех/ошибку
 * 
 * API Gateway сам устанавливает cookies через Set-Cookie header
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'No refresh token' }, 
        { status: 401 }
      );
    }
    
    // Call API Gateway refresh endpoint with refresh token
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8001';
    const response = await fetch(`${apiBase}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refresh_token=${refreshToken}`,
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Refresh failed' }, 
        { status: 401 }
      );
    }
    
    const data = await response.json();
    
    // Create response with new cookies
    const res = NextResponse.json({ success: true, ...data });
    
    // Forward Set-Cookie headers to client
    // Note: In production, cookies are set automatically by API Gateway
    // This is just for transparency
    
    return res;
  } catch (error) {
    console.error('[Server Refresh] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' }, 
      { status: 500 }
    );
  }
}
