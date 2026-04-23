"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Loader2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Star,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  Printer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCandidateAnalysis } from "@/lib/query/hooks/use-analysis";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-error";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "bg-success/10 border-success/20";
  if (score >= 50) return "bg-warning/10 border-warning/20";
  return "bg-error/10 border-error/20";
}

function getRecommendationLabel(rec: string | null) {
  switch (rec) {
    case "hire":
      return {
        label: "Strongly recommended",
        variant: "success" as const,
        icon: ThumbsUp,
      };
    case "consider":
      return {
        label: "Under consideration",
        variant: "warning" as const,
        icon: HelpCircle,
      };
    case "reject":
      return {
        label: "Not selected",
        variant: "error" as const,
        icon: ThumbsDown,
      };
    default:
      return null;
  }
}

export default function CandidateResultsPage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.id as string;

  const {
    data: analysis,
    isPending,
    error,
  } = useCandidateAnalysis(invitationId);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-error" />
        <h3 className="text-sm font-medium text-foreground mb-1">
          Results not available
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          {error instanceof Error
            ? error.message
            : "Your analysis is not ready yet or could not be loaded."}
        </p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (analysis.status === "pending" || analysis.status === "in_progress") {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardContent className="flex items-center gap-3 p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <div>
              <p className="text-base font-medium text-foreground">
                Analyzing your responses...
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                This page will update automatically when results are ready. It
                usually takes about a minute.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (analysis.status === "failed") {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-error" />
        <h3 className="text-sm font-medium text-foreground mb-1">
          Analysis could not be completed
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Please contact support. Your responses have been saved.
        </p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const rec = getRecommendationLabel(analysis.recommendation);
  const RecIcon = rec?.icon;
  const overallScore = analysis.overallScore ?? 0;

  return (
    <div className="space-y-6 max-w-4xl print:max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Your Interview Results
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {analysis.templateTitle}
        </p>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Company</p>
              <p className="text-sm font-medium text-foreground">
                {analysis.companyName || "—"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10">
              <Calendar className="h-4 w-4 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-sm font-medium text-foreground">
                {analysis.completedAt ? formatDate(analysis.completedAt) : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score summary */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-xl border-2 ${getScoreBg(overallScore)}`}
              >
                <span
                  className={`text-3xl font-bold ${getScoreColor(overallScore)}`}
                >
                  {overallScore}
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  Overall Score
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Based on AI analysis of your{" "}
                  {analysis.questionAnalyses?.length ?? 0} responses
                </p>
              </div>
            </div>
            {rec && RecIcon && (
              <Badge variant={rec.variant} className="text-sm px-3 py-1.5">
                <RecIcon className="w-4 h-4 mr-1" />
                {rec.label}
              </Badge>
            )}
          </div>

          {analysis.summary && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-foreground leading-relaxed">
                {analysis.summary}
              </p>
            </div>
          )}

          {/* Strengths / Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.strengths && analysis.strengths.length > 0 && (
              <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                <h4 className="text-sm font-medium text-success flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {analysis.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm text-foreground flex items-start gap-2"
                    >
                      <span className="text-success mt-0.5">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.weaknesses && analysis.weaknesses.length > 0 && (
              <div className="rounded-lg border border-error/20 bg-error/5 p-4">
                <h4 className="text-sm font-medium text-error flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4" />
                  Areas to improve
                </h4>
                <ul className="space-y-1">
                  {analysis.weaknesses.map((w, i) => (
                    <li
                      key={i}
                      className="text-sm text-foreground flex items-start gap-2"
                    >
                      <span className="text-error mt-0.5">-</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Per-question feedback */}
      {analysis.questionAnalyses && analysis.questionAnalyses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Question-by-question feedback
          </h2>
          <div className="space-y-4">
            {analysis.questionAnalyses.map((qa, idx) => (
              <Card key={idx}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary flex-shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {qa.questionText}
                      </p>
                    </div>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-md border ${getScoreBg(qa.score)} flex-shrink-0`}
                    >
                      <Star className={`w-3 h-3 ${getScoreColor(qa.score)}`} />
                      <span
                        className={`text-sm font-bold ${getScoreColor(qa.score)}`}
                      >
                        {qa.score}
                      </span>
                    </div>
                  </div>

                  {qa.responseText && (
                    <div className="ml-10 rounded-md border bg-muted/30 p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Your response:
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {qa.responseText}
                      </p>
                    </div>
                  )}

                  {qa.feedback && (
                    <div className="ml-10 rounded-md border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-start gap-2">
                        <Bot className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-primary mb-1">
                            AI feedback
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">
                            {qa.feedback}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="text-center py-6 text-xs text-muted-foreground">
        These results were generated by AI analysis. The final decision is made
        by the hiring team based on your overall profile.
      </div>
    </div>
  );
}
