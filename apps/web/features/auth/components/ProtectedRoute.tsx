'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireHR?: boolean;
}

/**
 * Client-side route protection (defense-in-depth).
 * Primary enforcement is in middleware.ts (server-side).
 * This component validates auth + roles via API call.
 */
export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireHR = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, roles, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requireAdmin && !roles.includes('admin')) {
      router.push('/dashboard');
      return;
    }

    if (requireHR && !roles.includes('hr') && !roles.includes('admin')) {
      router.push('/dashboard');
      return;
    }

    setAuthorized(true);
  }, [isAuthenticated, roles, loading, router, requireAdmin, requireHR]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/90 text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
