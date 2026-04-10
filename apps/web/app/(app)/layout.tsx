import { getUserRoles } from "@/lib/auth/get-user-roles";
import { redirect } from "next/navigation";
import { TokenRefreshProvider } from "@/components/auth/TokenRefreshProvider";
import { QueryClientProvider } from "@/lib/query/query-client";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

/**
 * BULLETPROOF AUTH - Level 2 Server-Side Protection
 *
 * Layout для authenticated страниц
 * - Получает роли через getUserRoles (с auto-refresh)
 * - Редиректит pending пользователей на /select-role
 * - Включает TokenRefreshProvider для proactive refresh (каждые 4 мин)
 *
 * Role-based protection происходит в middleware
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userRoles = await getUserRoles();

  const hasRealRole = userRoles.some((role) =>
    ["admin", "hr", "candidate"].includes(role),
  );
  const hasPendingRole = userRoles.includes("pending");

  console.log(
    "[APP-LAYOUT] getUserRoles result:",
    JSON.stringify({ userRoles, hasRealRole, hasPendingRole }),
  );

  // Only redirect to select-role if we KNOW user is pending (not when tokens expired)
  if (hasPendingRole && !hasRealRole) {
    console.log("[APP-LAYOUT] REDIRECTING to /select-role — user is pending");
    redirect("/select-role");
  }

  return (
    <QueryClientProvider>
      <TokenRefreshProvider>
        <AppShell userRoles={userRoles}>{children}</AppShell>
      </TokenRefreshProvider>
    </QueryClientProvider>
  );
}
