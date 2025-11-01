import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware для role-based routing
 * Редиректит /dashboard на role-specific dashboard
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only handle /dashboard redirect
  if (pathname !== '/dashboard') {
    return NextResponse.next();
  }

  // Get access token from cookie
  const accessToken = request.cookies.get('access_token')?.value;
  
  if (!accessToken) {
    // Not authenticated - redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Decode JWT payload (simple base64 decode)
    const parts = accessToken.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const roles: string[] = payload.realm_access?.roles || [];

    // Redirect to role-specific dashboard
    // Priority: admin > hr > candidate
    if (roles.includes('admin')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (roles.includes('hr')) {
      return NextResponse.redirect(new URL('/hr/dashboard', request.url));
    }
    if (roles.includes('candidate')) {
      return NextResponse.redirect(new URL('/candidate/dashboard', request.url));
    }

    // No recognized role - redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Middleware error:', error);
    // Invalid token - redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: '/dashboard',
};
