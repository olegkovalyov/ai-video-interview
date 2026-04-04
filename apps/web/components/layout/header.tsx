"use client";

import Link from "next/link";
import { useAuthStatus } from "@/lib/hooks/useAuth";
import { apiPost, apiGet } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { User } from "@/lib/types/user";
import { LogOut, ChevronDown, UserCircle } from "lucide-react";
import { SignInButton } from "@/features/auth";
import { LogoWithText } from "@/components/ui/logo";
import { logger } from "@/lib/logger";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  userRoles?: string[];
}

interface NavItem {
  href: string;
  label: string;
  matchPrefix?: boolean;
}

const NAV_CONFIG = {
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', matchPrefix: true },
    { href: '/admin/interviews', label: 'Interviews', matchPrefix: true },
    { href: '/admin/users', label: 'Users', matchPrefix: true },
    { href: '/admin/skills', label: 'Skills', matchPrefix: true },
  ],
  hr: [
    { href: '/hr/dashboard', label: 'Dashboard' },
    { href: '/hr/interviews/templates', label: 'Interviews', matchPrefix: true },
    { href: '/hr/companies', label: 'Companies', matchPrefix: true },
  ],
  candidate: [
    { href: '/candidate/dashboard', label: 'Dashboard', matchPrefix: true },
  ],
  guest: [
    { href: '/about', label: 'About' },
    { href: '/pricing', label: 'Pricing' },
  ],
};

function getRoleLabel(roles: string[]): { label: string; style: string } {
  if (roles.includes('admin')) return { label: 'Admin', style: 'bg-purple-500/30 text-purple-200 border-purple-400/50' };
  if (roles.includes('hr')) return { label: 'HR', style: 'bg-blue-500/30 text-blue-200 border-blue-400/50' };
  return { label: 'Candidate', style: 'bg-green-500/30 text-green-200 border-green-400/50' };
}

function getNavItems(roles: string[]): NavItem[] {
  if (roles.includes('admin')) return NAV_CONFIG.admin;
  if (roles.includes('hr')) return NAV_CONFIG.hr;
  if (roles.includes('candidate')) return NAV_CONFIG.candidate;
  return NAV_CONFIG.guest;
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.matchPrefix
    ? pathname.startsWith(item.href.split('/').slice(0, 3).join('/'))
    : pathname === item.href;

  return (
    <Link
      href={item.href}
      className={`text-white hover:text-yellow-400 transition-colors font-medium ${
        isActive ? 'text-yellow-400' : ''
      }`}
    >
      {item.label}
    </Link>
  );
}

export function Header({ userRoles = [] }: HeaderProps) {
  const { isAuthenticated, loading } = useAuthStatus();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setUser(null);
      return;
    }

    apiGet("/protected")
      .then((res) => setUser((res as { user: User }).user))
      .catch((err) => {
        logger.debug('Failed to load user in header:', err);
        setUser(null);
      });
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
      logger.error('Logout error:', error);
      router.replace("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = getNavItems(userRoles);
  const role = getRoleLabel(userRoles);
  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'U';

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <LogoWithText />
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="w-20 h-8 bg-white/20 animate-pulse rounded" />
            ) : (isAuthenticated || userRoles.length > 0) ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="User menu" className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer outline-none">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {initials}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                      <p className="text-xs text-white/70">{role.label}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/70 hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/10 backdrop-blur-xl border-white/20 rounded-lg shadow-2xl">
                  <DropdownMenuLabel className="px-3 py-2.5">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white leading-none">{user?.name || 'User'}</p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${role.style}`}>
                          {role.label}
                        </span>
                      </div>
                      <p className="text-xs leading-none text-white/60">{user?.email || ''}</p>
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
              <>
                <SignInButton variant="outline" size="sm" mode="login">
                  Login
                </SignInButton>
                <SignInButton variant="default" size="sm" mode="register">
                  Sign Up
                </SignInButton>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
