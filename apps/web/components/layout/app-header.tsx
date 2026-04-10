"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useAuthStatus } from "@/lib/hooks/useAuth";
import { apiPost, apiGet } from "@/lib/api";
import { logger } from "@/lib/logger";
import type { User } from "@/lib/types/user";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  userRoles?: string[];
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

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
    : "U";
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-foreground">{breadcrumb}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {initials}
          </div>
          <span className="hidden md:inline text-sm font-medium text-foreground">
            {user?.name || "User"}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline ml-2">
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </Button>
      </div>
    </header>
  );
}
