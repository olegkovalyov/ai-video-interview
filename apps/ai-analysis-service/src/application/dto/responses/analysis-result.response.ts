import { QuestionAnalysisResponse } from './question-analysis.response';

export interface AnalysisMetadataResponse {
  modelUsed: string;
  totalTokensUsed: number;
  processingTimeMs: number;
  processingTimeSeconds: number;
  questionsAnalyzed: number;
  averageTokensPerQuestion: number;
  language: string;
}

export interface AnalysisResultResponse {
  id: string;
  invitationId: string;
  candidateId: string;
  templateId: string;
  templateTitle: string;
  companyName: string;
  status: string;
  overallScore: number | null;
  overallScoreGrade: string | null;
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  recommendation: string | null;
  recommendationLabel: string | null;
  metadata: AnalysisMetadataResponse;
  errorMessage: string | null;
  questionsCount: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface AnalysisResultWithQuestionsResponse extends AnalysisResultResponse {
  questionAnalyses: QuestionAnalysisResponse[];
}
