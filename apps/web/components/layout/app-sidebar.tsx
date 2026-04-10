"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Building2,
  Star,
  Search,
  ClipboardList,
  Send,
  PanelLeftClose,
  PanelLeft,
  UserCircle,
} from "lucide-react";
import { LogoWithText } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: boolean;
}

const NAV_CONFIG: { admin: NavItem[]; hr: NavItem[]; candidate: NavItem[] } = {
  admin: [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      matchPrefix: true,
    },
    {
      href: "/admin/interviews",
      label: "Interviews",
      icon: ClipboardList,
      matchPrefix: true,
    },
    { href: "/admin/users", label: "Users", icon: Users, matchPrefix: true },
    { href: "/admin/skills", label: "Skills", icon: Star, matchPrefix: true },
  ],
  hr: [
    { href: "/hr/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/hr/interviews/templates",
      label: "Templates",
      icon: FileText,
      matchPrefix: true,
    },
    {
      href: "/hr/interviews",
      label: "Interviews",
      icon: ClipboardList,
      matchPrefix: false,
    },
    {
      href: "/hr/interviews/invitations",
      label: "Invitations",
      icon: Send,
      matchPrefix: true,
    },
    {
      href: "/hr/companies",
      label: "Companies",
      icon: Building2,
      matchPrefix: true,
    },
    {
      href: "/hr/candidates",
      label: "Candidates",
      icon: Search,
      matchPrefix: true,
    },
  ],
  candidate: [
    {
      href: "/candidate/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      matchPrefix: true,
    },
  ],
};

function getNavItems(roles: string[]): NavItem[] {
  if (roles.includes("admin")) return NAV_CONFIG.admin;
  if (roles.includes("hr")) return NAV_CONFIG.hr;
  if (roles.includes("candidate")) return NAV_CONFIG.candidate;
  return [];
}

function getRoleLabel(roles: string[]): string {
  if (roles.includes("admin")) return "Admin";
  if (roles.includes("hr")) return "HR Manager";
  return "Candidate";
}

interface AppSidebarProps {
  userRoles: string[];
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({
  userRoles,
  collapsed,
  onToggle,
}: AppSidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(userRoles);
  const roleLabel = getRoleLabel(userRoles);

  const isActive = (item: NavItem) => {
    if (item.matchPrefix) {
      return pathname.startsWith(item.href.split("/").slice(0, 3).join("/"));
    }
    return pathname === item.href;
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r transition-all duration-300 flex flex-col",
        "bg-[hsl(var(--sidebar))] border-[hsl(var(--sidebar-border))]",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[hsl(var(--sidebar-border))] px-4">
        <Link href="/" className="flex items-center overflow-hidden">
          {collapsed ? (
            <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-[60%] h-[60%]">
                <path
                  d="M4 8C4 6.89543 4.89543 6 6 6H14C15.1046 6 16 6.89543 16 8V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V8Z"
                  fill="white"
                />
                <path d="M16 10L20 8V16L16 14V10Z" fill="white" />
              </svg>
            </div>
          ) : (
            <LogoWithText variant="dark" />
          )}
        </Link>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-3">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {roleLabel}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-[hsl(var(--sidebar-foreground))] hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: Profile + Collapse */}
      <div className="border-t border-[hsl(var(--sidebar-border))] px-3 py-2 space-y-1">
        <Link
          href="/profile"
          title={collapsed ? "My Profile" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/profile")
              ? "bg-primary/10 text-primary"
              : "text-[hsl(var(--sidebar-foreground))] hover:bg-accent hover:text-accent-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          <UserCircle className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>My Profile</span>}
        </Link>

        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg p-2 text-[hsl(var(--sidebar-foreground))] hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
