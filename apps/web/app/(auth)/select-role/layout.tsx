import { MinimalHeader } from '@/components/layout/minimal-header';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Layout для страницы выбора роли
 * Показывает минималистичный header с email пользователя
 * 
 * Если токен expired или невалиден - редирект на /login
 * (SSO сессия Keycloak авто-логинит обратно)
 */
export default async function SelectRoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;
  
  // Если нет токенов вообще - на логин
  if (!accessToken && !refreshToken) {
    console.log('[Select Role Layout] No tokens - redirecting to /login');
    redirect('/login?from=/select-role');
  }
  
  // Проверяем валидность access_token
  let userEmail: string | undefined;
  
  if (accessToken) {
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3 && parts[1]) {
        const payload = JSON.parse(atob(parts[1]));
        const exp = payload.exp;
        const now = Math.floor(Date.now() / 1000);
        
        // Проверяем expiration
        if (exp && exp < now) {
          console.log('[Select Role Layout] Token expired - redirecting to /login');
          redirect('/login?from=/select-role');
        }
        
        // Извлекаем email
        userEmail = payload.email || payload.preferred_username;
        
        if (!userEmail) {
          console.warn('[Select Role Layout] ⚠️ No email in token');
        }
      }
    } catch (error) {
      console.error('[Select Role Layout] Token decode error:', error);
      redirect('/login?from=/select-role');
    }
  } else {
    // Есть только refresh_token - редирект на login для получения нового access_token
    console.log('[Select Role Layout] No access_token (only refresh) - redirecting to /login');
    redirect('/login?from=/select-role');
  }

  return (
    <>
      <MinimalHeader userEmail={userEmail} />
      {children}
    </>
  );
}
