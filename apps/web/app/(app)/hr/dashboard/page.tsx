"use client";

import Link from "next/link";
import { useHRInvitations } from "@/lib/query/hooks/use-invitations";
import { useActiveTemplates } from "@/lib/query/hooks/use-templates";
import {
  Loader2,
  Users,
  CheckCircle,
  FileText,
  Play,
  AlertCircle,
  Send,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HRDashboardPage() {
  const { data: invitationsData, isPending: invitationsLoading } =
    useHRInvitations({ limit: 100 });
  const { data: templates, isPending: templatesLoading } = useActiveTemplates();

  const loading = invitationsLoading || templatesLoading;
  const invitations = invitationsData?.items ?? [];

  const stats = [
    {
      label: "Active Interviews",
      value: invitations.filter((i) => i.status === "in_progress").length,
      icon: Play,
      color: "text-info",
      bg: "bg-info-light",
      href: "/hr/invitations",
    },
    {
      label: "Pending Reviews",
      value: invitations.filter((i) => i.status === "completed").length,
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success-light",
      href: "/hr/review",
    },
    {
      label: "Total Invitations",
      value: invitations.length,
      icon: Send,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/hr/invitations",
    },
    {
      label: "Templates",
      value: templates?.length ?? 0,
      icon: FileText,
      color: "text-warning",
      bg: "bg-warning-light",
      href: "/hr/templates",
    },
  ];

  const pendingReviews = invitations.filter(
    (i) => i.status === "completed",
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          HR Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of your recruitment activities
        </p>
      </div>

      {pendingReviews > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning-light p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {pendingReviews} candidate
                {pendingReviews > 1 ? "s" : ""} waiting for review
              </p>
              <p className="text-xs text-muted-foreground">
                Completed interviews need your evaluation
              </p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/hr/review">
              Review Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-all hover:shadow-md hover:border-primary/30">
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "-" : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-foreground">
            Quick Actions
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link
              href="/hr/candidates"
              className="flex items-center gap-3 rounded-lg border p-4 transition-all hover:shadow-sm hover:border-primary/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-light">
                <Users className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Invite Candidate
                </p>
                <p className="text-xs text-muted-foreground">
                  Search and send invitations
                </p>
              </div>
            </Link>

            <Link
              href="/hr/templates/create"
              className="flex items-center gap-3 rounded-lg border p-4 transition-all hover:shadow-sm hover:border-primary/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-light">
                <FileText className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Create Template
                </p>
                <p className="text-xs text-muted-foreground">
                  Design new interview
                </p>
              </div>
            </Link>

            <Link
              href="/hr/companies"
              className="flex items-center gap-3 rounded-lg border p-4 transition-all hover:shadow-sm hover:border-primary/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-light">
                <Building2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Manage Companies
                </p>
                <p className="text-xs text-muted-foreground">
                  Add or edit companies
                </p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
