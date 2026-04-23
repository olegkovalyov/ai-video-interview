"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCandidateInvitations,
  useStartInvitation,
} from "@/lib/query/hooks/use-invitations";
import {
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Inbox,
  ClipboardList,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CandidateDashboardPage() {
  const router = useRouter();
  const [startingId, setStartingId] = useState<string | null>(null);

  const { data, isPending, error, refetch, isFetching } =
    useCandidateInvitations({ limit: 100 });
  const startMutation = useStartInvitation();

  const invitations = data?.items ?? [];

  const handleStartInterview = async (id: string) => {
    setStartingId(id);
    startMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Interview started!");
        router.push(`/interview/${id}`);
      },
      onError: (err) => {
        const message =
          err instanceof Error ? err.message : "Failed to start interview";
        toast.error(message);
      },
      onSettled: () => setStartingId(null),
    });
  };

  const pendingCount = invitations.filter((i) => i.status === "pending").length;
  const inProgressCount = invitations.filter(
    (i) => i.status === "in_progress",
  ).length;
  const completedCount = invitations.filter(
    (i) => i.status === "completed",
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="warning">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="info">
            <Play className="mr-1 h-3 w-3" />
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="success">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="error">
            <AlertCircle className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const stats = [
    {
      label: "Pending",
      value: isPending ? "-" : pendingCount,
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning-light",
    },
    {
      label: "In Progress",
      value: isPending ? "-" : inProgressCount,
      icon: ClipboardList,
      color: "text-info",
      bg: "bg-info-light",
    },
    {
      label: "Completed",
      value: isPending ? "-" : completedCount,
      icon: BarChart3,
      color: "text-success",
      bg: "bg-success-light",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your interview invitations and progress
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Interview list */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-foreground">
            Your Interviews
          </h2>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error
                  ? error.message
                  : "Failed to load invitations"}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No interview invitations yet
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-start justify-between py-4 first:pt-0 last:pb-0 gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">
                        {invitation.templateTitle}
                      </p>
                      {getStatusBadge(invitation.status)}
                      {invitation.decision === "approved" && (
                        <Badge variant="success">
                          <ThumbsUp className="mr-1 h-3 w-3" />
                          Approved
                        </Badge>
                      )}
                      {invitation.decision === "rejected" && (
                        <Badge variant="error">
                          <ThumbsDown className="mr-1 h-3 w-3" />
                          Not selected
                        </Badge>
                      )}
                      {invitation.status === "completed" &&
                        !invitation.decision &&
                        invitation.analysisStatus &&
                        invitation.analysisStatus !== "completed" && (
                          <Badge variant="info">
                            <Bot className="mr-1 h-3 w-3 animate-spin" />
                            Analyzing...
                          </Badge>
                        )}
                      {invitation.status === "completed" &&
                        !invitation.decision &&
                        invitation.analysisStatus === "completed" && (
                          <Badge variant="info">Under review</Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>{invitation.companyName}</span>
                      <span>Invited {formatDate(invitation.createdAt)}</span>
                      {invitation.progress && (
                        <span>
                          Progress: {invitation.progress.answered}/
                          {invitation.progress.total}
                        </span>
                      )}
                      {invitation.status === "pending" &&
                        !isExpired(invitation.expiresAt) && (
                          <span>
                            Expires:{" "}
                            {new Date(
                              invitation.expiresAt,
                            ).toLocaleDateString()}
                          </span>
                        )}
                    </div>
                    {invitation.status === "pending" &&
                      isExpired(invitation.expiresAt) && (
                        <p className="text-xs text-destructive">
                          This invitation has expired
                        </p>
                      )}
                    {invitation.decision && invitation.decisionNote && (
                      <div
                        className={`mt-2 rounded-md border p-3 ${
                          invitation.decision === "approved"
                            ? "border-success/30 bg-success/5"
                            : "border-muted bg-muted/30"
                        }`}
                      >
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          Message from {invitation.companyName}:
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {invitation.decisionNote}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    {invitation.status === "pending" &&
                      !isExpired(invitation.expiresAt) && (
                        <Button
                          size="sm"
                          onClick={() => handleStartInterview(invitation.id)}
                          disabled={startingId === invitation.id}
                        >
                          {startingId === invitation.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="mr-2 h-4 w-4" />
                          )}
                          {startingId === invitation.id
                            ? "Starting..."
                            : "Start"}
                        </Button>
                      )}

                    {invitation.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(`/interview/${invitation.id}`)
                        }
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </Button>
                    )}

                    {invitation.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/candidate/results/${invitation.id}`)
                        }
                      >
                        View Results
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
