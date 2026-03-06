'use client';

import { useEffect, useRef } from 'react';
import { apiPost } from '@/lib/api';
import { logger } from '@/lib/logger';
import { AUTH } from '@/lib/constants/app';

/**
 * BULLETPROOF AUTH - Level 3 Proactive Token Refresh
 *
 * Refreshes tokens every 4 minutes (before 5-minute access_token expiry).
 * Combined with reactive refresh (lib/api.ts 401 retry) for bulletproof auth.
 */
export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    const performRefresh = async () => {
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;

      try {
        await apiPost('/auth/refresh');
      } catch (error) {
        logger.debug('Token refresh failed (expected if session expired):', error);
      } finally {
        isRefreshingRef.current = false;
      }
    };

    refreshIntervalRef.current = setInterval(performRefresh, AUTH.TOKEN_REFRESH_INTERVAL_MS);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return <>{children}</>;
}
