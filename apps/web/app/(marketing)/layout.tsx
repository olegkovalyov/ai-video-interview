import { Header } from "@/components/layout/header";
import { getUserRoles } from "@/lib/auth/get-user-roles";

export const dynamic = 'force-dynamic';

/**
 * Marketing Layout
 * 
 * Для публичных страниц (/, /about, /pricing)
 * Если пользователь authenticated - передаём роли в Header
 */
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Пытаемся получить роли (если пользователь authenticated)
  let userRoles: string[] = [];
  try {
    userRoles = await getUserRoles();
  } catch (error) {
    // Если не authenticated - просто пустой массив
    userRoles = [];
  }
  
  return (
    <>
      <Header userRoles={userRoles} />
      {children}
    </>
  );
}
