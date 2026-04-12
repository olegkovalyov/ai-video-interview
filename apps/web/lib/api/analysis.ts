/**
 * Analysis API Client
 * Fetches AI analysis results from API Gateway
 */

import { apiGet } from "@/lib/api";

// ========================================
// TYPES
// ========================================

export interface CriteriaScore {
  criterion: string;
  score: number;
  weight: number;
}

export interface QuestionAnalysis {
  id: string;
  questionId: string;
  questionText: string;
  questionType: string;
  responseText: string;
  score: number;
  feedback: string;
  criteriaScores: CriteriaScore[];
  isCorrect?: boolean;
}

export interface AnalysisResult {
  id: string;
  invitationId: string;
  candidateId: string;
  templateId: string;
  templateTitle: string;
  companyName: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  overallScore: number | null;
  summary: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  recommendation: "hire" | "consider" | "reject" | null;
  language: string;
  modelUsed: string;
  totalTokensUsed: number;
  processingTimeMs: number;
  errorMessage: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  questionAnalyses?: QuestionAnalysis[];
}

export interface AnalysisStatus {
  found: boolean;
  id?: string;
  invitationId: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "not_found";
  createdAt?: string;
  updatedAt?: string;
}

// ========================================
// API FUNCTIONS
// ========================================

/**
 * Get full analysis results by invitation ID (HR/Admin)
 * GET /api/analysis/:invitationId
 */
export async function getAnalysis(
  invitationId: string,
): Promise<AnalysisResult | null> {
  try {
    const response = await apiGet<{ success: boolean; data: AnalysisResult }>(
      `/api/analysis/${invitationId}`,
    );
    return response.data ?? null;
  } catch (error: any) {
    if (error?.statusCode === 404) return null;
    throw error;
  }
}

/**
 * Get analysis processing status (HR/Admin/Candidate)
 * GET /api/analysis/status/:invitationId
 */
export async function getAnalysisStatus(
  invitationId: string,
): Promise<AnalysisStatus> {
  const response = await apiGet<{ success: boolean; data: AnalysisStatus }>(
    `/api/analysis/status/${invitationId}`,
  );
  return response.data;
}
