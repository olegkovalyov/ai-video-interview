"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Star, Clock, Eye, Trophy, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHRInvitations } from "@/lib/query/hooks/use-invitations";

function getScoreBadge(score: number) {
  if (score >= 90) return { label: "Excellent", variant: "success" as const };
  if (score >= 75) return { label: "Good", variant: "warning" as const };
  if (score >= 60) return { label: "Average", variant: "info" as const };
  return { label: "Below Average", variant: "error" as const };
}

function getScoreColor(score: number) {
  if (score >= 90) return "text-success";
  if (score >= 75) return "text-warning";
  if (score >= 60) return "text-info";
  return "text-error";
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function generateRandomScore(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return 60 + Math.abs(hash % 40);
}

const selectClass =
  "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function CandidateCompletedTab() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<"date" | "score">("date");

  const { data, isPending } = useHRInvitations({
    status: "completed",
    limit: 100,
  });
  const invitations = data?.items ?? [];

  const invitationsWithScores = invitations.map((inv) => ({
    ...inv,
    score: generateRandomScore(inv.id),
  }));

  const sortedInterviews = [...invitationsWithScores].sort((a, b) => {
    if (sortBy === "score") return b.score - a.score;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const avgScore =
    invitationsWithScores.length > 0
      ? Math.round(
          invitationsWithScores.reduce((sum, i) => sum + i.score, 0) /
            invitationsWithScores.length,
        )
      : 0;

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-light">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {invitations.length}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-light">
              <Trophy className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {avgScore > 0 ? `${avgScore}%` : "\u2014"}
              </p>
              <p className="text-xs text-muted-foreground">Average Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-light">
              <Eye className="h-4 w-4 text-info" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {invitations.length}
              </p>
              <p className="text-xs text-muted-foreground">Needs Review</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {invitations.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-sm font-medium text-foreground mb-1">
            No completed interviews yet
          </h3>
          <p className="text-xs text-muted-foreground">
            Completed interviews will appear here for review
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {sortedInterviews.length} completed interview
              {sortedInterviews.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "score")}
                className={selectClass}
              >
                <option value="date">Date</option>
                <option value="score">Score</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {sortedInterviews.map((interview) => {
              const scoreBadge = getScoreBadge(interview.score);
              const candidateName =
                interview.candidateName ||
                interview.candidateEmail?.split("@")[0] ||
                "Unknown";
              const initials = candidateName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <Card
                  key={interview.id}
                  className="transition-all hover:shadow-md hover:border-primary/30"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary flex-shrink-0">
                          {initials}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {candidateName}
                            </p>
                            <Badge variant={scoreBadge.variant}>
                              <Star className="mr-1 h-3 w-3" />
                              {scoreBadge.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{interview.templateTitle}</span>
                            {interview.companyName && (
                              <span>{interview.companyName}</span>
                            )}
                            {interview.progress && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {interview.progress.answered}/
                                {interview.progress.total} questions
                              </span>
                            )}
                            <span>{formatDate(interview.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xl font-bold ${getScoreColor(interview.score)}`}
                        >
                          {interview.score}%
                        </span>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/hr/review/${interview.id}`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
