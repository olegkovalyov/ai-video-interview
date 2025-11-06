import { getUserRoles } from "@/lib/auth/get-user-roles";
import { redirect } from "next/navigation";

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
  
  console.log('[Dashboard Redirect] User roles:', userRoles);
  
  // Redirect based on role priority: admin > hr > candidate
  if (userRoles.includes('admin')) {
    console.log('[Dashboard Redirect] Redirecting to /admin/dashboard');
    redirect('/admin/dashboard');
  } else if (userRoles.includes('hr')) {
    console.log('[Dashboard Redirect] Redirecting to /hr/dashboard');
    redirect('/hr/dashboard');
  } else if (userRoles.includes('candidate')) {
    console.log('[Dashboard Redirect] Redirecting to /candidate/dashboard');
    redirect('/candidate/dashboard');
  }
  
  // Fallback - should not reach here if user has valid role
  console.log('[Dashboard Redirect] No valid role found - redirecting to /select-role');
  redirect('/select-role');
}
