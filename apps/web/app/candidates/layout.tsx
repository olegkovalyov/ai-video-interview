import { HeaderWithRoles } from '@/components/layout/header-with-roles';

export default async function CandidatesLayout({
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
