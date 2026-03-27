import { getUserRoles } from "@/lib/auth/get-user-roles";
import { redirect } from "next/navigation";
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Dashboard Redirect Page
 * 
 * Редиректит на role-specific dashboard:
 * - admin → /admin/dashboard
 * - hr → /hr/dashboard
 * - candidate → /candidate/dashboard
 */
export default async function DashboardRedirectPage() {
  const userRoles = await getUserRoles();
  
  logger.debug('[Dashboard Redirect] User roles:', userRoles);
  
  // Redirect based on role priority: admin > hr > candidate
  if (userRoles.includes('admin')) {
    logger.debug('[Dashboard Redirect] Redirecting to /admin/dashboard');
    redirect('/admin/dashboard');
  } else if (userRoles.includes('hr')) {
    logger.debug('[Dashboard Redirect] Redirecting to /hr/dashboard');
    redirect('/hr/dashboard');
  } else if (userRoles.includes('candidate')) {
    logger.debug('[Dashboard Redirect] Redirecting to /candidate/dashboard');
    redirect('/candidate/dashboard');
  }
  
  // Fallback - should not reach here if user has valid role
  logger.debug('[Dashboard Redirect] No valid role found - redirecting to /select-role');
  redirect('/select-role');
}
