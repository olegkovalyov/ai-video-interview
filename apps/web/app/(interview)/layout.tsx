import { getUserRoles } from '@/lib/auth/get-user-roles';
import { redirect } from 'next/navigation';
import { TokenRefreshProvider } from '@/components/auth/TokenRefreshProvider';

export const dynamic = 'force-dynamic';

/**
 * Fullscreen Interview Layout
 * 
 * - NO Header (fullscreen experience)
 * - TokenRefreshProvider for auth
 * - Protected route (requires authentication)
 */
export default async function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userRoles = await getUserRoles();

  const hasRealRole = userRoles.some(role => ['admin', 'hr', 'candidate'].includes(role));
  const hasPendingRole = userRoles.includes('pending');
  
  if (!hasRealRole && (userRoles.length === 0 || hasPendingRole)) {
    redirect('/select-role');
  }

  return (
    <TokenRefreshProvider>
      <div className="min-h-screen">
        {children}
      </div>
    </TokenRefreshProvider>
  );
}
