'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireHR?: boolean;
}

/**
 * Client-side защита роутов
 * Дополнительная проверка авторизации на клиенте
 */
export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireHR = false 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      // Если не авторизован - редирект на login
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // TODO: Проверка ролей когда будет role в user object
      // if (requireAdmin && user?.role !== 'admin') {
      //   router.push('/dashboard');
      //   return;
      // }

      // if (requireHR && !['admin', 'hr'].includes(user?.role || '')) {
      //   router.push('/dashboard');
      //   return;
      // }

      setIsChecking(false);
    }
  }, [isAuthenticated, loading, router]);

  // Показываем loader пока проверяем
  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/90 text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Если проверка прошла - показываем контент
  return <>{children}</>;
}
