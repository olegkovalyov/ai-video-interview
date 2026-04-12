"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Play,
  FileText,
  Code,
  Video,
  Bot,
  User,
  Calendar,
  Building2,
  Loader2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Star,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useInvitation,
  useHRInvitations,
} from "@/lib/query/hooks/use-invitations";
import { useAnalysis } from "@/lib/query/hooks/use-analysis";
import type { InvitationResponse, Question } from "@/lib/api/invitations";
import type { QuestionAnalysis } from "@/lib/api/analysis";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
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

function getRecommendationConfig(rec: string | null) {
  switch (rec) {
    case "hire":
      return {
        label: "Hire",
        variant: "success" as const,
        icon: ThumbsUp,
      };
    case "consider":
      return {
        label: "Consider",
        variant: "warning" as const,
        icon: HelpCircle,
      };
    case "reject":
      return {
        label: "Reject",
        variant: "error" as const,
        icon: ThumbsDown,
      };
    default:
      return {
        label: "Pending",
        variant: "info" as const,
        icon: HelpCircle,
      };
  }
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.id as string;

  const {
    data: invitation,
    isPending,
    error,
  } = useInvitation(invitationId, true);
  const { data: listData } = useHRInvitations({
    status: "completed",
    limit: 100,
  });
  const { data: analysis, isPending: analysisLoading } =
    useAnalysis(invitationId);

  const listItem = listData?.items?.find((item) => item.id === invitationId);
  const candidateName = listItem?.candidateName || null;

  const getQuestions = (): Question[] => {
    if (!invitation) return [];
    if (invitation.questions) return invitation.questions;
    if (invitation.template?.questions) return invitation.template.questions;
    return [];
  };

  const getResponseForQuestion = (
    questionId: string,
  ): InvitationResponse | undefined => {
    return invitation?.responses?.find((r) => r.questionId === questionId);
  };

  const getQuestionAnalysis = (
    questionId: string,
  ): QuestionAnalysis | undefined => {
    return analysis?.questionAnalyses?.find(
      (qa) => qa.questionId === questionId,
    );
  };

  const getTotalDuration = (): number => {
    if (!invitation?.responses) return 0;
    return invitation.responses.reduce((sum, r) => sum + r.duration, 0);
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-error" />
        <h3 className="text-sm font-medium text-foreground mb-1">
          Failed to load interview
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "Interview not found"}
        </p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const questions = getQuestions();
  const totalDuration = getTotalDuration();
  const templateTitle =
    invitation.templateTitle || invitation.template?.title || "Interview";
  const rec = getRecommendationConfig(analysis?.recommendation ?? null);
  const RecIcon = rec.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {templateTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {candidateName || "Candidate"} &middot;{" "}
            {invitation.companyName || ""}
          </p>
        </div>

        {analysis?.status === "completed" && (
          <div className="text-right">
            <Badge variant={rec.variant} className="text-sm px-3 py-1">
              <RecIcon className="w-4 h-4 mr-1" />
              {rec.label}
            </Badge>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Candidate</p>
              <p className="text-sm font-medium text-foreground">
                {candidateName || "Unknown"}
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
                {invitation.completedAt
                  ? formatDate(invitation.completedAt)
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-medium text-foreground">
                {formatDuration(totalDuration)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Questions</p>
              <p className="text-sm font-medium text-foreground">
                {invitation.responses?.length || 0}/{questions.length} answered
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Summary */}
      {analysisLoading ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading AI analysis...
            </span>
          </CardContent>
        </Card>
      ) : analysis?.status === "completed" ? (
        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Score + Recommendation */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-xl border ${getScoreBg(analysis.overallScore ?? 0)}`}
                >
                  <span
                    className={`text-2xl font-bold ${getScoreColor(analysis.overallScore ?? 0)}`}
                  >
                    {analysis.overallScore}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    AI Analysis
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Model: {analysis.modelUsed} &middot;{" "}
                    {(analysis.processingTimeMs / 1000).toFixed(1)}s &middot;{" "}
                    {analysis.totalTokensUsed.toLocaleString()} tokens
                  </p>
                </div>
              </div>
              <Badge variant={rec.variant} className="text-sm px-3 py-1.5">
                <RecIcon className="w-4 h-4 mr-1" />
                {rec.label}
              </Badge>
            </div>

            {/* Summary */}
            {analysis.summary && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            )}

            {/* Strengths & Weaknesses */}
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
                    Weaknesses
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
      ) : analysis?.status === "in_progress" ||
        analysis?.status === "pending" ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                AI Analysis in progress...
              </p>
              <p className="text-xs text-muted-foreground">
                This page will update automatically when analysis is complete
              </p>
            </div>
          </CardContent>
        </Card>
      ) : analysis?.status === "failed" ? (
        <Card className="border-error/30">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertCircle className="w-5 h-5 text-error" />
            <div>
              <p className="text-sm font-medium text-foreground">
                AI Analysis failed
              </p>
              <p className="text-xs text-muted-foreground">
                {analysis.errorMessage || "Unknown error"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Questions & Responses */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Questions & Responses ({questions.length})
        </h2>

        {questions.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No questions found for this interview
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => {
              const response = getResponseForQuestion(question.id);
              const qa = getQuestionAnalysis(question.id);

              return (
                <Card key={question.id}>
                  <CardContent className="p-5">
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {question.text}
                          </p>
                          {question.hints && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">
                              Hint: {question.hints}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {qa && (
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-md border ${getScoreBg(qa.score)}`}
                          >
                            <Star
                              className={`w-3 h-3 ${getScoreColor(qa.score)}`}
                            />
                            <span
                              className={`text-sm font-bold ${getScoreColor(qa.score)}`}
                            >
                              {qa.score}
                            </span>
                          </div>
                        )}
                        {response && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(response.duration)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Response */}
                    {response ? (
                      <div className="ml-10">
                        {response.textAnswer && (
                          <div className="rounded-md border bg-muted/30 p-3 mb-2">
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {response.textAnswer}
                            </p>
                          </div>
                        )}
                        {response.responseType === "video" &&
                          response.videoUrl && (
                            <div className="rounded-md border bg-muted/30 p-3 mb-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(response.videoUrl, "_blank")
                                }
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Play Video
                              </Button>
                            </div>
                          )}
                        {response.responseType === "code" &&
                          response.codeAnswer && (
                            <div className="rounded-md bg-zinc-900 p-3 mb-2 font-mono text-sm overflow-x-auto">
                              <pre className="text-green-400 whitespace-pre-wrap">
                                {response.codeAnswer}
                              </pre>
                            </div>
                          )}

                        {/* AI Feedback for this question */}
                        {qa?.feedback && (
                          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 mt-2">
                            <div className="flex items-start gap-2">
                              <Bot className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-foreground leading-relaxed">
                                {qa.feedback}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="ml-10 rounded-md border border-error/20 bg-error/5 p-3">
                        <p className="text-sm text-error flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          No response submitted
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
