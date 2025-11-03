"use client";

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

interface User {
  sub: string;
  email?: string;
  preferred_username?: string;
  name?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Вызываем защищенный endpoint чтобы проверить аутентификацию
      const response = await apiGet<{ user: User }>('/protected');
      
      setAuthState({
        isAuthenticated: true,
        user: response.user,
        loading: false,
        error: null
      });
    } catch (error) {
      // Если ошибка 401 - пользователь не аутентифицирован
      // Любая другая ошибка - тоже считаем не аутентифицированным
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication check failed'
      });
    }
  };

  return authState;
}

// Альтернативный более простой hook если нужно только проверить статус
export function useAuthStatus(): { isAuthenticated: boolean; loading: boolean } {
  const { isAuthenticated, loading } = useAuth();
  return { isAuthenticated, loading };
}
