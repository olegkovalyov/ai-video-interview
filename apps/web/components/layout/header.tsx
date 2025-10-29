"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuthStatus } from "@/hooks/useAuth"
import { apiPost, apiGet } from "@/app/lib/api"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { LogOut, User, ChevronDown, LayoutDashboard, Briefcase, UserCircle } from "lucide-react"
import { SignInButton } from "@/components/auth/sign-in-button"
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
  currentPage?: string
}

export function Header({ currentPage }: HeaderProps) {
  const { isAuthenticated, loading } = useAuthStatus();
  const router = useRouter();
  const pathname = usePathname();
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
          <Link href="/">
            <LogoWithText />
          </Link>
          
          {/* Navigation для authenticated users */}
          {isAuthenticated ? (
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/dashboard" 
                className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                  pathname.startsWith('/dashboard') ? 'text-yellow-400' : ''
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/interviews" 
                className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                  pathname.startsWith('/interviews') ? 'text-yellow-400' : ''
                }`}
              >
                Interviews
              </Link>
              <Link 
                href="/candidates" 
                className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                  pathname.startsWith('/candidates') ? 'text-yellow-400' : ''
                }`}
              >
                Candidates
              </Link>
              {/* TODO: Add role check when roles are implemented */}
              <Link 
                href="/admin/users" 
                className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                  pathname.startsWith('/admin') ? 'text-yellow-400' : ''
                }`}
              >
                Users
              </Link>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center space-x-6">
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
            </nav>
          )}

          <div className="flex items-center space-x-3">
            {loading ? (
              // Показываем лоадер пока проверяем аутентификацию
              <div className="w-20 h-8 bg-white/20 animate-pulse rounded"></div>
            ) : isAuthenticated ? (
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
                        {user?.role || 'User'}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/70 hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/10 backdrop-blur-xl border-white/20 rounded-lg shadow-2xl">
                  <DropdownMenuLabel className="px-3 py-2.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold text-white leading-none">{user?.name || 'User'}</p>
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
                <SignInButton variant="glass" size="sm">
                  Login
                </SignInButton>
                <SignInButton variant="brand" size="sm">
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
