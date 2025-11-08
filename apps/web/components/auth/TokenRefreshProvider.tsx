'use client';

import { useEffect, useRef } from 'react';
import { apiPost } from '@/lib/api';

/**
 * BULLETPROOF AUTH - Level 3 Proactive Token Refresh
 * 
 * Client-side provider для PROACTIVE обновления токенов
 * 
 * Стратегия:
 * - Обновляет токены каждые 4 минуты (ДО истечения 5-минутного access_token)
 * - Работает в background, не зависит от user actions
 * - Гарантирует что токен НИКОГДА не истечёт при активной сессии
 * 
 * Вместе с reactive refresh (lib/api.ts при 401) создаёт bulletproof систему:
 * - Proactive: обновляет до истечения
 * - Reactive: обновляет при 401 (если proactive не сработал)
 */
export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  
  useEffect(() => {
    const performRefresh = async () => {
      // Prevent concurrent refreshes
      if (isRefreshingRef.current) {
        return;
      }
      
      isRefreshingRef.current = true;
      
      try {
        await apiPost('/auth/refresh');
      } catch (error) {
        console.error('[TokenRefreshProvider] ❌ Refresh failed:', error);
        // If refresh fails, user will be redirected to login on next API request
        // This is expected behavior when refresh_token expires
      } finally {
        isRefreshingRef.current = false;
      }
    };
    
    // Refresh every 4 minutes (access_token expires in 5 minutes)
    // This ensures token is always fresh during active session
    const REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes
    
    // Start interval
    refreshIntervalRef.current = setInterval(performRefresh, REFRESH_INTERVAL);
    
    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);
  
  return <>{children}</>;
}
