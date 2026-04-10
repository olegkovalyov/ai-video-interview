"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUserRoles } from "@/lib/auth/roles-context";
import { apiPost } from "@/lib/api";
import { Loader2 } from "lucide-react";

/**
 * Dashboard Redirect Page
 *
 * Reads roles from RolesContext (provided by AppShell).
 * If roles are empty (token expired during SSR), triggers a client-side
 * refresh and reloads the page so the server can read the new cookies.
 */
export default function DashboardRedirectPage() {
  const roles = useUserRoles();
  const router = useRouter();
  const refreshAttempted = useRef(false);

  useEffect(() => {
    if (roles.includes("admin")) {
      router.replace("/admin/dashboard");
    } else if (roles.includes("hr")) {
      router.replace("/hr/dashboard");
    } else if (roles.includes("candidate")) {
      router.replace("/candidate/dashboard");
    } else if (!refreshAttempted.current) {
      // Roles empty — token was expired during SSR.
      // Refresh on client side, then reload so server gets new cookies.
      refreshAttempted.current = true;
      apiPost("/auth/refresh")
        .then(() => {
          window.location.reload();
        })
        .catch(() => {
          router.replace("/login");
        });
    }
  }, [roles, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
}
