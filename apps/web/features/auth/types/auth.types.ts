export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireHR?: boolean;
}

export interface SignInButtonProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

export interface JWTPayload {
  sub: string;
  email?: string;
  realm_access?: {
    roles: string[];
  };
  exp?: number;
  iat?: number;
}
