"use client";

import Link from "next/link";
import { apiPost } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import { LogoWithText } from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MinimalHeaderProps {
  userEmail?: string;
}

/**
 * Minimal Header for role selection page
 * Shows logo and logout dropdown only
 */
export function MinimalHeader({ userEmail }: MinimalHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

          <div className="flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer outline-none">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    ?
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs text-white/70">
                      {userEmail || 'Unknown User'}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/70 hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/10 backdrop-blur-xl border-white/20 rounded-lg shadow-2xl">
                <DropdownMenuLabel className="px-3 py-2.5">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs leading-none text-white/60">
                      {userEmail || 'Unknown User'}
                    </p>
                  </div>
                </DropdownMenuLabel>
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
          </div>
        </div>
      </div>
    </header>
  );
}
