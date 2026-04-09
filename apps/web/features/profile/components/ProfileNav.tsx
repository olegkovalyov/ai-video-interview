"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, Shield, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileNavProps {
  userRoles?: string[];
}

export function ProfileNav({ userRoles = [] }: ProfileNavProps) {
  const pathname = usePathname();
  const isCandidate = userRoles.includes("candidate");

  const tabs = [
    {
      name: "Personal Info",
      href: "/profile",
      icon: User,
      active: pathname === "/profile",
      visible: true,
    },
    {
      name: "Security",
      href: "/profile/security",
      icon: Shield,
      active: pathname === "/profile/security",
      visible: true,
    },
    {
      name: "Skills",
      href: "/profile/skills",
      icon: Star,
      active: pathname === "/profile/skills",
      visible: isCandidate,
    },
  ].filter((tab) => tab.visible);

  return (
    <aside className="w-56 flex-shrink-0">
      <nav className="rounded-lg border bg-card p-1.5 space-y-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                tab.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
