"use client";

import { useCallback } from 'react';
import { apiPost } from '@/lib/api';

export function useAuthRefresh() {
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Attempting silent token refresh...');
      
      const response = await apiPost<{ success: boolean; expiresIn?: number }>('/auth/refresh');
      
      if (response.success) {
        console.log('✅ Silent token refresh successful');
        return true;
      } else {
        console.log('❌ Silent token refresh failed:', response);
        return false;
      }
    } catch (error) {
      console.error('❌ Silent token refresh error:', error);
      return false;
    }
  }, []);

  return { refreshTokens };
}
