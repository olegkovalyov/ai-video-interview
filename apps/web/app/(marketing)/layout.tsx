import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { getUserRoles } from "@/lib/auth/get-user-roles";

export const dynamic = "force-dynamic";

/**
 * Marketing Layout
 *
 * Для публичных страниц (/, /about, /pricing)
 * Light header + footer. Если authenticated — показываем "Go to Dashboard".
 */
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userRoles: string[] = [];
  try {
    userRoles = await getUserRoles();
  } catch {
    userRoles = [];
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader userRoles={userRoles} />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
