import { HeaderWithRoles } from '@/components/layout/header-with-roles';

/**
 * Server Component Layout для /dashboard
 * Рендерит Header с ролями, полученными на сервере
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HeaderWithRoles />
      {children}
    </>
  );
}
