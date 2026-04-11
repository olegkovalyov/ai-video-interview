"use client";

import { useState } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { RolesProvider } from "@/lib/auth/roles-context";
import { cn } from "@/lib/utils";

interface AppShellProps {
  userRoles: string[];
  children: React.ReactNode;
}

export function AppShell({ userRoles, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <RolesProvider roles={userRoles}>
      <div className="min-h-screen bg-background">
        <AppSidebar
          userRoles={userRoles}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
        <div
          className={cn(
            "flex flex-col transition-all duration-300",
            collapsed ? "ml-16" : "ml-60",
          )}
        >
          <AppHeader userRoles={userRoles} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </RolesProvider>
  );
}
