import { AnalysisResult } from '../../domain/aggregates/analysis-result.aggregate';
import { QuestionAnalysis } from '../../domain/entities/question-analysis.entity';
import { CriteriaScore } from '../../domain/value-objects/criteria-score.vo';
import {
  AnalysisResultResponse,
  AnalysisResultWithQuestionsResponse,
  AnalysisMetadataResponse,
} from '../dto/responses/analysis-result.response';
import {
  QuestionAnalysisResponse,
  CriteriaScoreResponse,
} from '../dto/responses/question-analysis.response';

export class AnalysisResultMapper {
  static toResponse(analysis: AnalysisResult): AnalysisResultResponse {
    return {
      id: analysis.id,
      invitationId: analysis.invitationId,
      candidateId: analysis.candidateId,
      templateId: analysis.templateId,
      templateTitle: analysis.templateTitle,
      companyName: analysis.companyName,
      status: analysis.status.value,
      overallScore: analysis.overallScore?.value ?? null,
      overallScoreGrade: analysis.overallScore?.gradeLabel ?? null,
      summary: analysis.summary,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      recommendation: analysis.recommendation?.value ?? null,
      recommendationLabel: analysis.recommendation?.label ?? null,
      metadata: this.toMetadataResponse(analysis),
      errorMessage: analysis.errorMessage,
      questionsCount: analysis.questionsCount,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
      completedAt: analysis.completedAt,
    };
  }

  static toResponseWithQuestions(analysis: AnalysisResult): AnalysisResultWithQuestionsResponse {
    return {
      ...this.toResponse(analysis),
      questionAnalyses: analysis.questionAnalyses.map(qa => this.toQuestionAnalysisResponse(qa)),
    };
  }

  static toQuestionAnalysisResponse(qa: QuestionAnalysis): QuestionAnalysisResponse {
    return {
      id: qa.id,
      questionId: qa.questionId,
      questionText: qa.questionText,
      questionType: qa.questionType.value,
      responseText: qa.responseText,
      score: qa.score.value,
      scoreGrade: qa.score.gradeLabel,
      feedback: qa.feedback,
      criteriaScores: qa.criteriaScores.map(cs => this.toCriteriaScoreResponse(cs)),
      isCorrect: qa.isCorrect,
      createdAt: qa.createdAt,
    };
  }

  private static toCriteriaScoreResponse(cs: CriteriaScore): CriteriaScoreResponse {
    return {
      criterion: cs.criterion,
      criterionLabel: cs.criterionLabel,
      score: cs.score.value,
      weight: cs.weight,
    };
  }

  private static toMetadataResponse(analysis: AnalysisResult): AnalysisMetadataResponse {
    const metadata = analysis.metadata;
    return {
      modelUsed: metadata.modelUsed,
      totalTokensUsed: metadata.totalTokensUsed,
      processingTimeMs: metadata.processingTimeMs,
      processingTimeSeconds: metadata.processingTimeSeconds,
      questionsAnalyzed: metadata.questionsAnalyzed,
      averageTokensPerQuestion: metadata.averageTokensPerQuestion,
      language: metadata.language,
    };
  }
}
