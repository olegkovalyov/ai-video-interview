"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Star,
  Clock,
  Eye,
  Trophy,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Bot,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHRInvitations } from "@/lib/query/hooks/use-invitations";

function getScoreBadge(score: number | undefined) {
  if (score === undefined || score === null)
    return { label: "Pending", variant: "info" as const };
  if (score >= 75) return { label: "Excellent", variant: "success" as const };
  if (score >= 50) return { label: "Good", variant: "warning" as const };
  if (score >= 25) return { label: "Average", variant: "info" as const };
  return { label: "Below Average", variant: "error" as const };
}

function getScoreColor(score: number | undefined) {
  if (score === undefined || score === null) return "text-muted-foreground";
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-error";
}

function getRecommendationBadge(rec: string | undefined) {
  switch (rec) {
    case "hire":
      return { label: "Hire", variant: "success" as const, icon: ThumbsUp };
    case "consider":
      return {
        label: "Consider",
        variant: "warning" as const,
        icon: HelpCircle,
      };
    case "reject":
      return { label: "Reject", variant: "error" as const, icon: ThumbsDown };
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

  const sortedInterviews = [...invitations].sort((a, b) => {
    if (sortBy === "score")
      return (b.analysisScore ?? -1) - (a.analysisScore ?? -1);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const scored = invitations.filter(
    (i) => i.analysisScore !== undefined && i.analysisScore !== null,
  );
  const avgScore =
    scored.length > 0
      ? Math.round(
          scored.reduce((sum, i) => sum + (i.analysisScore ?? 0), 0) /
            scored.length,
        )
      : null;
  const needsReview = invitations.filter(
    (i) => !i.analysisStatus || i.analysisStatus === "completed",
  ).length;

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
                {avgScore !== null ? `${avgScore}%` : "\u2014"}
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
              <p className="text-xl font-bold text-foreground">{needsReview}</p>
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
              const score = interview.analysisScore;
              const scoreBadge = getScoreBadge(score ?? undefined);
              const recBadge = getRecommendationBadge(
                interview.analysisRecommendation ?? undefined,
              );
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
              const analysisInProgress =
                interview.analysisStatus === "pending" ||
                interview.analysisStatus === "in_progress";

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
                            {score !== undefined && score !== null && (
                              <Badge variant={scoreBadge.variant}>
                                <Star className="mr-1 h-3 w-3" />
                                {scoreBadge.label}
                              </Badge>
                            )}
                            {recBadge && (
                              <Badge variant={recBadge.variant}>
                                <recBadge.icon className="mr-1 h-3 w-3" />
                                {recBadge.label}
                              </Badge>
                            )}
                            {analysisInProgress && (
                              <Badge variant="info">
                                <Bot className="mr-1 h-3 w-3 animate-spin" />
                                Analyzing...
                              </Badge>
                            )}
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
                        {score !== undefined && score !== null ? (
                          <span
                            className={`text-xl font-bold ${getScoreColor(score)}`}
                          >
                            {score}%
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            &mdash;
                          </span>
                        )}
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
