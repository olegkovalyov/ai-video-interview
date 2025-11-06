export const dynamic = 'force-dynamic';

/**
 * Dashboard Layout
 * 
 * Header уже рендерится в родительском (app)/layout.tsx
 * Этот layout только для вложенной структуры, если понадобится
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
