import { Header } from './header';
import { getUserRoles } from '@/lib/auth/get-user-roles';

/**
 * Server Component wrapper для Header
 * Читает роли на сервере и передаёт в Client Component Header
 */
export async function HeaderWithRoles() {
  const userRoles = await getUserRoles();
  
  return <Header userRoles={userRoles} />;
}
