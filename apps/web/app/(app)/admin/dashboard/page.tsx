"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/lib/query/hooks/use-users";
import { Users, ClipboardList, Star, Activity } from "lucide-react";

export default function AdminDashboardPage() {
  const { data: users = [] } = useUsers();

  const totalUsers = users.length;
  const activeUsers = users.filter(
    (u: { enabled?: boolean }) => u.enabled !== false,
  ).length;

  const stats = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Active Users",
      value: activeUsers,
      icon: Activity,
      color: "text-success",
      bg: "bg-success-light",
    },
    {
      label: "Interviews",
      value: "\u2014",
      icon: ClipboardList,
      color: "text-info",
      bg: "bg-info-light",
    },
    {
      label: "Skills",
      value: "\u2014",
      icon: Star,
      color: "text-warning",
      bg: "bg-warning-light",
    },
  ];

  const quickLinks = [
    {
      href: "/admin/users",
      label: "Manage Users",
      description: "Create, edit, and manage user accounts",
      icon: Users,
    },
    {
      href: "/admin/interviews",
      label: "Interviews",
      description: "Monitor interview templates and activity",
      icon: ClipboardList,
    },
    {
      href: "/admin/skills",
      label: "Skills",
      description: "Manage skill taxonomy and categories",
      icon: Star,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          System overview and management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Card
            key={link.href}
            className="transition-all hover:shadow-md hover:border-primary/30"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <link.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {link.label}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {link.description}
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={link.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Activity monitoring coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
