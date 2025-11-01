import { HeaderWithRoles } from '@/components/layout/header-with-roles';
export const dynamic = 'force-dynamic';

export default async function AdminUsersLayout({
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
