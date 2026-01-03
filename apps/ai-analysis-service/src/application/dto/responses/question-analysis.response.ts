export interface CriteriaScoreResponse {
  criterion: string;
  criterionLabel: string;
  score: number;
  weight: number;
}

export interface QuestionAnalysisResponse {
  id: string;
  questionId: string;
  questionText: string;
  questionType: string;
  responseText: string;
  score: number;
  scoreGrade: string;
  feedback: string;
  criteriaScores: CriteriaScoreResponse[];
  isCorrect?: boolean;
  createdAt: Date;
}
