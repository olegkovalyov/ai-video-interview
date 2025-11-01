import { HeaderWithRoles } from '@/components/layout/header-with-roles';

export default async function AdminDashboardLayout({
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
