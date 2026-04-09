"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, UserCircle, ChevronDown } from "lucide-react";
import { useAuthStatus } from "@/lib/hooks/useAuth";
import { apiPost, apiGet } from "@/lib/api";
import { logger } from "@/lib/logger";
import type { User } from "@/lib/types/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  userRoles?: string[];
}

function getRoleBadge(roles: string[]): { label: string; className: string } {
  if (roles.includes("admin"))
    return {
      label: "Admin",
      className:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    };
  if (roles.includes("hr"))
    return {
      label: "HR",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    };
  return {
    label: "Candidate",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  };
}

function getBreadcrumb(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Home";
  const last = segments.at(-1) ?? "Home";
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
}

export function AppHeader({ userRoles = [] }: AppHeaderProps) {
  const { isAuthenticated } = useAuthStatus();
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
        logger.debug("Failed to load user in header:", err);
        setUser(null);
      });
  }, [isAuthenticated]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const response = (await apiPost("/auth/logout")) as {
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
      logger.error("Logout error:", error);
      router.replace("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const role = getRoleBadge(userRoles);
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
    : "U";
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-6">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{breadcrumb}</span>
      </div>

      {/* Right: user menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="User menu"
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors cursor-pointer outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-foreground leading-none">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground">{role.label}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold leading-none">
                  {user?.name || "User"}
                </p>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${role.className}`}
                >
                  {role.label}
                </span>
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || ""}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <UserCircle className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleLogout}
            disabled={isLoggingOut}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
