"use client";

import { useState } from "react";
import {
  Clock,
  Play,
  AlertCircle,
  Loader2,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHRInvitations } from "@/lib/query/hooks/use-invitations";
import type { InvitationStatus } from "@/lib/api/invitations";

type FilterStatus = "all" | "pending" | "in_progress";

function getStatusBadge(status: InvitationStatus) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="warning">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="info">
          <Play className="w-3 h-3 mr-1" />
          In Progress
        </Badge>
      );
    case "expired":
      return (
        <Badge variant="error">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    default:
      return null;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CandidateInvitedTab() {
  const [filter, setFilter] = useState<FilterStatus>("all");

  const { data, isPending, error, refetch, isFetching } = useHRInvitations({
    limit: 100,
  });

  const invitations = (data?.items ?? []).filter(
    (inv) =>
      inv.status === "pending" ||
      inv.status === "in_progress" ||
      inv.status === "expired",
  );

  const filteredInvitations = invitations.filter((inv) => {
    if (filter === "all") return true;
    return inv.status === filter;
  });

  const pendingCount = invitations.filter((i) => i.status === "pending").length;
  const inProgressCount = invitations.filter(
    (i) => i.status === "in_progress",
  ).length;

  return (
    <div className="space-y-6">
      {/* Filter Pills + Refresh */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({invitations.length})
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          Pending ({pendingCount})
        </Button>
        <Button
          variant={filter === "in_progress" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("in_progress")}
        >
          In Progress ({inProgressCount})
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="ml-auto"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {isPending ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">
              Failed to load invitations
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <Button size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : filteredInvitations.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-sm font-medium text-foreground mb-1">
            No invitations found
          </h3>
          <p className="text-xs text-muted-foreground">
            Invite candidates from the Search tab
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvitations.map((invitation) => {
            const candidateName =
              invitation.candidateName ||
              invitation.candidateEmail?.split("@")[0] ||
              "Unknown";
            const initials = candidateName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card
                key={invitation.id}
                className="transition-all hover:shadow-md hover:border-primary/30"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary flex-shrink-0">
                        {initials}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground">
                            {candidateName}
                          </p>
                          {getStatusBadge(invitation.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {invitation.candidateEmail || invitation.candidateId}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>{invitation.templateTitle}</span>
                          {invitation.companyName && (
                            <span>{invitation.companyName}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Expires: {formatDate(invitation.expiresAt)}
                          </span>
                        </div>

                        {/* Progress bar for in_progress */}
                        {invitation.status === "in_progress" &&
                          invitation.progress && (
                            <div className="mt-2 max-w-xs">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>Progress</span>
                                <span>
                                  {invitation.progress.answered}/
                                  {invitation.progress.total} questions
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{
                                    width: `${invitation.progress.percentage}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                        {/* Timestamps */}
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span>
                            Invited: {formatDate(invitation.createdAt)}
                          </span>
                          {invitation.startedAt && (
                            <span>
                              Started: {formatDate(invitation.startedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
