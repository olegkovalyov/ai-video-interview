export const ANALYSIS_ENGINE = Symbol('IAnalysisEngine');

export interface QuestionAnalysisInput {
  questionId: string;
  questionText: string;
  questionType: string;
  responseText: string;
  correctAnswer?: string;
}

export interface CriteriaScoreOutput {
  criterion: string;
  score: number;
  weight: number;
}

export interface QuestionAnalysisOutput {
  score: number;
  feedback: string;
  criteriaScores: CriteriaScoreOutput[];
  tokensUsed: number;
}

export interface SummaryInput {
  questionAnalyses: Array<{
    questionText: string;
    responseText: string;
    score: number;
    feedback: string;
  }>;
  templateTitle: string;
  companyName: string;
}

export interface SummaryOutput {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: 'hire' | 'consider' | 'reject';
  tokensUsed: number;
}

export interface IAnalysisEngine {
  analyzeResponse(input: QuestionAnalysisInput): Promise<QuestionAnalysisOutput>;
  generateSummary(input: SummaryInput): Promise<SummaryOutput>;
}
