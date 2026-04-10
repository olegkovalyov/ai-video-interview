import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  decodeJwtPayload,
  extractAppRoles,
  isPendingOnly,
} from "@/lib/auth/decode-jwt";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/about",
  "/pricing",
  "/auth/callback",
];

/**
 * BULLETPROOF MIDDLEWARE - Level 1 Defense
 *
 * 1. Public routes → pass through
 * 2. Pending users → redirect to /select-role
 * 3. Role-based route protection (admin/hr/candidate)
 * 4. No tokens → redirect to /login
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute =
    pathname === "/" ||
    PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/"),
    );
  const isSelectRolePage = pathname === "/select-role";

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Decode roles from access token (if present)
  let roles: string[] = [];
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    if (payload) {
      roles = extractAppRoles(payload);
    }
  }

  console.log(
    `[MIDDLEWARE] ${pathname} | hasAccess=${!!accessToken} hasRefresh=${!!refreshToken} roles=${JSON.stringify(roles)}`,
  );

  // Pending users → only /select-role and /auth/callback allowed
  if (roles.length > 0 && isPendingOnly(roles)) {
    console.log(
      `[MIDDLEWARE] REDIRECT to /select-role — pending only, from ${pathname}`,
    );
    if (!isSelectRolePage && pathname !== "/auth/callback") {
      return NextResponse.redirect(new URL("/select-role", request.url));
    }
  }

  // Public routes pass through
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Must have at least one token for protected routes
  if (!accessToken && !refreshToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection (only if we have decoded roles)
  if (roles.length > 0) {
    // /select-role only for pending users — if user has real role, go to dashboard
    if (isSelectRolePage && !isPendingOnly(roles)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (pathname.startsWith("/admin") && !roles.includes("admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname.startsWith("/hr") && !roles.includes("hr")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname.startsWith("/candidate") && !roles.includes("candidate")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
