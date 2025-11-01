import { Header } from '@/components/layout/header';
import { getUserRoles } from '@/lib/auth/get-user-roles';

/**
 * Layout для authenticated страниц
 * Server Component - читает роли на сервере и передаёт в Header
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Читаем роли из JWT на сервере
  const userRoles = await getUserRoles();

  return (
    <>
      <Header userRoles={userRoles} />
      {children}
    </>
  );
}
