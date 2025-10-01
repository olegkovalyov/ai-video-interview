"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuthStatus } from "@/hooks/useAuth"
import { apiPost, apiGet } from "@/app/lib/api"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { LogOut } from "lucide-react"

interface HeaderProps {
  currentPage?: string
}

export function Header({ currentPage }: HeaderProps) {
  const { isAuthenticated, loading } = useAuthStatus();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated) {
        try {
          const res = await apiGet("/protected") as { user: any };
          setUser(res.user);
        } catch (error) {
          console.error('Failed to load user:', error);
        }
      }
    };

    loadUser();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      const response = await apiPost("/auth/logout") as { 
        success: boolean; 
        requiresRedirect?: boolean; 
        endSessionEndpoint?: string; 
      };
      
      if (response.requiresRedirect && response.endSessionEndpoint) {
        window.location.href = response.endSessionEndpoint;
        return;
      }
      
      router.replace("/");
    } catch (error) {
      console.error('Logout error:', error);
      router.replace("/");
    } finally {
      setIsLoggingOut(false);
    }
  };
  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🎥</span>
            <span className="text-xl font-bold text-white">
              AI Video Interview
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/about" 
              className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                currentPage === 'about' ? 'text-yellow-400' : ''
              }`}
            >
              About
            </Link>
            <Link 
              href="/pricing" 
              className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                currentPage === 'pricing' ? 'text-yellow-400' : ''
              }`}
            >
              Pricing
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            {loading ? (
              // Показываем лоадер пока проверяем аутентификацию
              <div className="w-20 h-8 bg-white/20 animate-pulse rounded"></div>
            ) : isAuthenticated ? (
              // Если пользователь залогинен - показываем профиль и иконку выхода
              <>
                <Button asChild variant="glass" size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <div className="flex items-center space-x-3 pl-3 border-l border-white/30">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-white">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-white/70">
                      {user?.role || 'Admin'}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-white/80 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              // Если не залогинен - показываем Login/Register
              <>
                <Button asChild variant="glass" size="sm">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild variant="brand" size="sm">
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
