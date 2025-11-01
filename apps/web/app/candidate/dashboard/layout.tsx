import { HeaderWithRoles } from '@/components/layout/header-with-roles';

export default async function CandidateDashboardLayout({
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
