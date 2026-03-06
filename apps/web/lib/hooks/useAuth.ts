"use client";

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import { logger } from '@/lib/logger';

interface ProtectedUser {
  sub: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  realm_access?: { roles: string[] };
  [key: string]: unknown;
}

interface AuthState {
  isAuthenticated: boolean;
  user: ProtectedUser | null;
  roles: string[];
  loading: boolean;
  error: string | null;
}

const APP_ROLES = ['admin', 'hr', 'candidate', 'pending'] as const;

function extractAppRoles(user: ProtectedUser | null): string[] {
  const allRoles = user?.realm_access?.roles || [];
  return allRoles.filter(r => (APP_ROLES as readonly string[]).includes(r));
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    roles: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const response = await apiGet<{ user: ProtectedUser }>('/protected');

        if (!cancelled) {
          setAuthState({
            isAuthenticated: true,
            user: response.user,
            roles: extractAppRoles(response.user),
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        logger.debug('Auth check failed:', error instanceof Error ? error.message : error);

        if (!cancelled) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            roles: [],
            loading: false,
            error: error instanceof Error ? error.message : 'Authentication check failed',
          });
        }
      }
    };

    checkAuth();
    return () => { cancelled = true; };
  }, []);

  return authState;
}

export function useAuthStatus(): { isAuthenticated: boolean; loading: boolean } {
  const { isAuthenticated, loading } = useAuth();
  return { isAuthenticated, loading };
}
