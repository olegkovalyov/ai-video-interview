import { Injectable } from '@nestjs/common';
import { AnalysisResultEntity } from '../entities/analysis-result.entity';
import { QuestionAnalysisEntity } from '../entities/question-analysis.entity';

/**
 * Simple mapper for Step 3 - direct entity operations
 * Full domain mapping will be implemented in Step 4
 */
@Injectable()
export class AnalysisResultMapper {
  toDto(entity: AnalysisResultEntity): Record<string, any> {
    return {
      id: entity.id,
      invitationId: entity.invitationId,
      candidateId: entity.candidateId,
      templateId: entity.templateId,
      templateTitle: entity.templateTitle,
      companyName: entity.companyName,
      status: entity.status,
      overallScore: entity.overallScore,
      summary: entity.summary,
      strengths: entity.strengths,
      weaknesses: entity.weaknesses,
      recommendation: entity.recommendation,
      errorMessage: entity.errorMessage,
      modelUsed: entity.modelUsed,
      totalTokensUsed: entity.totalTokensUsed,
      processingTimeMs: entity.processingTimeMs,
      language: entity.language,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      completedAt: entity.completedAt,
      questionAnalyses: (entity.questionAnalyses || []).map((qa) => ({
        id: qa.id,
        questionId: qa.questionId,
        questionText: qa.questionText,
        questionType: qa.questionType,
        responseText: qa.responseText,
        score: qa.score,
        feedback: qa.feedback,
        criteriaScores: qa.criteriaScores,
        isCorrect: qa.isCorrect,
        tokensUsed: qa.tokensUsed,
        createdAt: qa.createdAt,
      })),
    };
  }
}
