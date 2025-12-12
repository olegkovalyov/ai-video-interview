"use client";

import Link from "next/link"
import { useAuthStatus } from "@/lib/hooks/useAuth"
import { apiPost, apiGet } from "@/lib/api"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import type { User } from "@/lib/types/user"
import { LogOut, ChevronDown, UserCircle } from "lucide-react"
import { SignInButton } from "@/features/auth"
import { LogoWithText } from "@/components/ui/logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  userRoles?: string[]; // Роли передаются из Server Component
}

export function Header({ userRoles = [] }: HeaderProps) {
  const { isAuthenticated, loading } = useAuthStatus();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated) {
        try {
          const res = await apiGet("/protected") as { user: User };
          setUser(res.user);
        } catch (error) {
          console.error('[Header] Failed to load user:', error);
          // На ошибке очищаем пользователя
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUser();
    
    // TokenRefreshProvider обновляет токены каждые 4 минуты
    // Нам не нужен interval - просто загружаем при mount
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
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <LogoWithText />
          </Link>
          
          {/* Role-based Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* Определяем primary role: admin > hr > candidate */}
            {(() => {
              const isAdmin = userRoles.includes('admin');
              const isHR = userRoles.includes('hr');
              const isCandidate = userRoles.includes('candidate');
              
              // ADMIN MENU
              if (isAdmin) {
                return (
                  <>
                    <Link 
                      href="/admin/dashboard" 
                      className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                        pathname.startsWith('/admin/dashboard') ? 'text-yellow-400' : ''
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/admin/interviews" 
                      className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                        pathname.startsWith('/admin/interviews') ? 'text-yellow-400' : ''
                      }`}
                    >
                      Interviews
                    </Link>
                    <Link 
                      href="/admin/users" 
                      className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                        pathname.startsWith('/admin/users') ? 'text-yellow-400' : ''
                      }`}
                    >
                      Users
                    </Link>
                    <Link 
                      href="/admin/skills" 
                      className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                        pathname.startsWith('/admin/skills') ? 'text-yellow-400' : ''
                      }`}
                    >
                      Skills
                    </Link>
                  </>
                );
              }
              
              // HR MENU
              if (isHR) {
                return (
                  <>
                    <Link 
                      href="/hr/dashboard" 
                      className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                        pathname.startsWith('/hr/dashboard') ? 'text-yellow-400' : ''
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/hr/candidates" 
                      className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                        pathname.startsWith('/hr/candidates') ? 'text-yellow-400' : ''
                      }`}
                    >
                      Candidates
                    </Link>
                    <Link 
                      href="/hr/templates" 
                      className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                        pathname.startsWith('/hr/templates') || pathname.startsWith('/hr/interviews') ? 'text-yellow-400' : ''
                      }`}
                    >
                      Templates
                    </Link>
                    <Link 
                      href="/hr/companies" 
                      className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                        pathname.startsWith('/hr/companies') ? 'text-yellow-400' : ''
                      }`}
                    >
                      Companies
                    </Link>
                  </>
                );
              }
              
              // CANDIDATE MENU
              if (isCandidate) {
                return (
                  <>
                    <Link 
                      href="/candidate/dashboard" 
                      className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                        pathname.startsWith('/candidate/dashboard') ? 'text-yellow-400' : ''
                      }`}
                    >
                      Dashboard
                    </Link>
                  </>
                );
              }
              
              // Guest menu (no roles)
              return (
                <>
                  <Link 
                    href="/about" 
                    className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                      pathname === '/about' ? 'text-yellow-400' : ''
                    }`}
                  >
                    About
                  </Link>
                  <Link 
                    href="/pricing" 
                    className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                      pathname === '/pricing' ? 'text-yellow-400' : ''
                    }`}
                  >
                    Pricing
                  </Link>
                </>
              );
            })()}
          </nav>

          <div className="flex items-center space-x-3">
            {loading ? (
              // Показываем лоадер пока проверяем аутентификацию
              <div className="w-20 h-8 bg-white/20 animate-pulse rounded"></div>
            ) : (isAuthenticated || userRoles.length > 0) ? (
              // Если пользователь залогинен - показываем user menu
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer outline-none">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-white">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-white/70">
                        {userRoles.includes('admin') ? 'Admin' : userRoles.includes('hr') ? 'HR' : 'Candidate'}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/70 hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/10 backdrop-blur-xl border-white/20 rounded-lg shadow-2xl">
                  <DropdownMenuLabel className="px-3 py-2.5">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white leading-none">{user?.name || 'User'}</p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          userRoles.includes('admin') 
                            ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50' 
                            : userRoles.includes('hr')
                            ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                            : 'bg-green-500/30 text-green-200 border border-green-400/50'
                        }`}>
                          {userRoles.includes('admin') ? 'Admin' : userRoles.includes('hr') ? 'HR' : 'Candidate'}
                        </span>
                      </div>
                      <p className="text-xs leading-none text-white/60">
                        {user?.email || 'user@example.com'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem asChild className="px-3 py-2.5">
                    <Link href="/profile" className="cursor-pointer text-white hover:bg-white/20 transition-colors">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem
                    onSelect={handleLogout}
                    disabled={isLoggingOut}
                    className="px-3 py-2.5 cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/20 focus:text-red-300 focus:bg-red-500/20 transition-colors"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Если не залогинен - показываем Login/Register
              <>
                <SignInButton variant="glass" size="sm" mode="login">
                  Login
                </SignInButton>
                <SignInButton variant="brand" size="sm" mode="register">
                  Sign Up
                </SignInButton>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
