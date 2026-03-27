"use client";

import { useCallback } from 'react';
import { apiPost } from '@/lib/api';
import { logger } from '@/lib/logger';

export function useAuthRefresh() {
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      logger.debug('Attempting silent token refresh');
      
      const response = await apiPost<{ success: boolean; expiresIn?: number }>('/auth/refresh');
      
      if (response.success) {
        logger.debug('Silent token refresh successful');
        return true;
      } else {
        logger.debug('Silent token refresh failed', response);
        return false;
      }
    } catch (error) {
      logger.error('Silent token refresh error:', error);
      return false;
    }
  }, []);

  return { refreshTokens };
}
