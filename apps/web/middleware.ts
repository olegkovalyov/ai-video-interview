import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * BULLETPROOF MIDDLEWARE - Level 1 Defense
 * 
 * Роль: Минимальный Guard - проверяет наличие токенов
 * 
 * Логика:
 * 1. Публичные роуты → пропускаем
 * 2. Защищенные роуты:
 *    - Есть access_token ИЛИ refresh_token → пропускаем
 *    - Нет ни одного токена → редирект на /login
 * 
 * Server Components и Client Components сами делают refresh если нужно
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('[Middleware] 🛡️ Guard check:', pathname);
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/about', '/pricing', '/auth/callback'];
  const isPublicRoute = pathname === '/' || publicRoutes.some(route => {
    // For root path, only exact match
    if (route === '/') return pathname === '/';
    // For other paths, check if pathname starts with route
    return pathname === route || pathname.startsWith(route + '/');
  });
  
  // /select-role - специальная страница для pending пользователей
  const isSelectRolePage = pathname === '/select-role';
  
  // Check for ANY token (access or refresh)
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  
  // КРИТИЧЕСКИ ВАЖНО: Проверяем pending пользователей ПЕРЕД публичными роутами!
  if (accessToken) {
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3 && parts[1]) {
        const payload = JSON.parse(atob(parts[1]));
        const roles: string[] = payload.realm_access?.roles || [];
        const exp = payload.exp;
        const now = Math.floor(Date.now() / 1000);
        
        console.log('[Middleware] 🔍 Token check for', pathname);
        console.log('[Middleware] Roles:', roles);
        console.log('[Middleware] Expired:', exp ? (exp < now ? 'YES' : 'NO') : 'UNKNOWN');
        
        // ВСЕГДА проверяем pending (даже если токен expired)
        const hasRealRole = roles.some(role => ['admin', 'hr', 'candidate'].includes(role));
        const hasPendingOnly = roles.includes('pending') && !hasRealRole;
        
        // Pending пользователи могут быть ТОЛЬКО на /select-role и /auth/callback
        if (hasPendingOnly && !isSelectRolePage && pathname !== '/auth/callback') {
          console.log('[Middleware] ⚠️ PENDING user (expired:', exp && exp < now, ') trying to access', pathname, '- BLOCKING and redirecting to /select-role');
          const selectRoleUrl = new URL('/select-role', request.url);
          return NextResponse.redirect(selectRoleUrl);
        }
      }
    } catch (error) {
      console.error('[Middleware] ❌ Failed to decode token for pending check:', error);
    }
  }
  
  // Public routes pass (for non-authenticated users or users with real roles)
  if (isPublicRoute) {
    console.log('[Middleware] ✅ Public route - allowing');
    return NextResponse.next();
  }
  
  // If we have at least one token, check role-based access
  if (accessToken || refreshToken) {
    // If we have access token, check roles for protected routes
    if (accessToken) {
      try {
        const parts = accessToken.split('.');
        if (parts.length === 3 && parts[1]) {
          const payload = JSON.parse(atob(parts[1]));
          const roles: string[] = payload.realm_access?.roles || [];
          
          console.log('[Middleware] User roles:', roles);
          
          // Проверяем наличие реальной роли
          const hasRealRole = roles.some(role => ['admin', 'hr', 'candidate'].includes(role));
          
          // /select-role - только для pending пользователей
          // Если у пользователя уже есть реальная роль, редиректим на dashboard
          if (isSelectRolePage && hasRealRole) {
            console.log('[Middleware] ❌ User with real role trying to access /select-role - redirecting to /dashboard');
            const dashboardUrl = new URL('/dashboard', request.url);
            return NextResponse.redirect(dashboardUrl);
          }
          
          // СТРОГАЯ защита role-based роутов - каждая роль только в своем пространстве
          
          // Защита admin роутов - ТОЛЬКО для admin
          if (pathname.startsWith('/admin') && !roles.includes('admin')) {
            console.log('[Middleware] ❌ Non-admin trying to access admin route - redirecting to /dashboard');
            const dashboardUrl = new URL('/dashboard', request.url);
            return NextResponse.redirect(dashboardUrl);
          }
          
          // Защита HR роутов - ТОЛЬКО для HR
          if (pathname.startsWith('/hr') && !roles.includes('hr')) {
            console.log('[Middleware] ❌ Non-HR trying to access HR route - redirecting to /dashboard');
            const dashboardUrl = new URL('/dashboard', request.url);
            return NextResponse.redirect(dashboardUrl);
          }
          
          // Защита candidate роутов - ТОЛЬКО для candidate
          if (pathname.startsWith('/candidate') && !roles.includes('candidate')) {
            console.log('[Middleware] ❌ Non-candidate trying to access candidate route - redirecting to /dashboard');
            const dashboardUrl = new URL('/dashboard', request.url);
            return NextResponse.redirect(dashboardUrl);
          }
          
        }
      } catch (error) {
        console.error('[Middleware] ❌ Failed to decode token:', error);
      }
    }
    
    console.log('[Middleware] ✅ Token exists (access:', !!accessToken, 'refresh:', !!refreshToken, ') - allowing');
    return NextResponse.next();
  }
  
  // No tokens at all - redirect to login
  console.log('[Middleware] ❌ No tokens found - redirect to login');
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Match all routes except public and static
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
