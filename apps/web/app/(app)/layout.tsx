import { Header } from '@/components/layout/header';
import { getUserRoles } from '@/lib/auth/get-user-roles';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * BULLETPROOF AUTH - Level 2 Server-Side Protection
 * 
 * Layout для authenticated страниц
 * - Получает роли через getUserRoles (с auto-refresh)
 * - Редиректит pending пользователей на /select-role
 * 
 * Role-based protection происходит в middleware
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Читаем роли из JWT на сервере (с auto-refresh если expired)
  const userRoles = await getUserRoles();

  // Проверяем наличие реальной роли (не только pending)
  const hasRealRole = userRoles.some(role => ['admin', 'hr', 'candidate'].includes(role));
  const hasPendingRole = userRoles.includes('pending');
  
  // Если ТОЛЬКО pending (нет реальной роли) - редиректим на страницу выбора роли
  if (!hasRealRole && (userRoles.length === 0 || hasPendingRole)) {
    redirect('/select-role');
  }

  return (
    <>
      <Header userRoles={userRoles} />
      {children}
    </>
  );
}
