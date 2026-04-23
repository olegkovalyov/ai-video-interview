"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, Shield, Star, Bell, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileTabsProps {
  userRoles?: string[];
}

export function ProfileTabs({ userRoles = [] }: ProfileTabsProps) {
  const pathname = usePathname();
  const isCandidate = userRoles.includes("candidate");
  const canManageBilling =
    userRoles.includes("hr") || userRoles.includes("admin");

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
      name: "Notifications",
      href: "/profile/notifications",
      icon: Bell,
      active: pathname === "/profile/notifications",
      visible: true,
    },
    {
      name: "Billing",
      href: "/profile/billing",
      icon: CreditCard,
      active: pathname === "/profile/billing",
      visible: canManageBilling,
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
    <div className="border-b">
      <nav className="-mb-px flex gap-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors",
                tab.active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
