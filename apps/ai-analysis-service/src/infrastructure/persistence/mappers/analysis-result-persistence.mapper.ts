import { Injectable } from '@nestjs/common';
import { AnalysisResult } from '../../../domain/aggregates/analysis-result.aggregate';
import { QuestionAnalysis } from '../../../domain/entities/question-analysis.entity';
import { AnalysisResultEntity } from '../entities/analysis-result.entity';
import { QuestionAnalysisEntity } from '../entities/question-analysis.entity';

/**
 * Bidirectional mapper between domain aggregates and TypeORM entities.
 *
 * - toEntity(): Domain → TypeORM (for persistence)
 * - toDomain(): TypeORM → Domain (for reconstitution via factory method)
 */
@Injectable()
export class AnalysisResultPersistenceMapper {
  toEntity(domain: AnalysisResult): AnalysisResultEntity {
    const entity = new AnalysisResultEntity();
    entity.id = domain.id;
    entity.invitationId = domain.invitationId;
    entity.candidateId = domain.candidateId;
    entity.templateId = domain.templateId;
    entity.templateTitle = domain.templateTitle;
    entity.companyName = domain.companyName;
    entity.status = domain.status.value;
    entity.overallScore = domain.overallScore?.value ?? null;
    entity.summary = domain.summary;
    entity.strengths = domain.strengths;
    entity.weaknesses = domain.weaknesses;
    entity.recommendation = domain.recommendation?.value ?? null;
    entity.errorMessage = domain.errorMessage;
    entity.modelUsed = domain.metadata.modelUsed || null;
    entity.totalTokensUsed = domain.metadata.totalTokensUsed;
    entity.processingTimeMs = domain.metadata.processingTimeMs;
    entity.language = domain.metadata.language;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    entity.completedAt = domain.completedAt;

    entity.questionAnalyses = domain.questionAnalyses.map((qa) =>
      this.questionToEntity(qa, domain.id),
    );

    return entity;
  }

  toDomain(entity: AnalysisResultEntity): AnalysisResult {
    const questionAnalyses = (entity.questionAnalyses || []).map((qaEntity) =>
      this.questionToDomain(qaEntity),
    );

    return AnalysisResult.reconstitute(
      {
        invitationId: entity.invitationId,
        candidateId: entity.candidateId,
        templateId: entity.templateId,
        templateTitle: entity.templateTitle,
        companyName: entity.companyName,
        status: entity.status,
        overallScore: entity.overallScore,
        summary: entity.summary,
        strengths: entity.strengths ?? [],
        weaknesses: entity.weaknesses ?? [],
        recommendation: entity.recommendation,
        metadata: {
          modelUsed: entity.modelUsed || '',
          totalTokensUsed: entity.totalTokensUsed,
          processingTimeMs: entity.processingTimeMs,
          questionsAnalyzed: (entity as any).questionAnalysesCount ?? (entity.questionAnalyses || []).length,
          language: entity.language,
        },
        errorMessage: entity.errorMessage,
        questionAnalyses,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        completedAt: entity.completedAt,
      },
      entity.id,
    );
  }

  private questionToEntity(domain: QuestionAnalysis, analysisResultId: string): QuestionAnalysisEntity {
    const entity = new QuestionAnalysisEntity();
    entity.id = domain.id;
    entity.analysisResultId = analysisResultId;
    entity.questionId = domain.questionId;
    entity.questionText = domain.questionText;
    entity.questionType = domain.questionType.value;
    entity.responseText = domain.responseText;
    entity.score = domain.score.value;
    entity.feedback = domain.feedback;
    entity.criteriaScores = domain.criteriaScores.map((cs) => ({
      criterion: cs.criterion,
      score: cs.score.value,
      weight: cs.weight,
    }));
    entity.isCorrect = domain.isCorrect ?? null;
    entity.tokensUsed = domain.tokensUsed;
    entity.createdAt = domain.createdAt;
    return entity;
  }

  private questionToDomain(entity: QuestionAnalysisEntity): QuestionAnalysis {
    return QuestionAnalysis.reconstitute(
      {
        questionId: entity.questionId,
        questionText: entity.questionText,
        questionType: entity.questionType,
        responseText: entity.responseText,
        score: entity.score,
        feedback: entity.feedback,
        criteriaScores: (entity.criteriaScores || []).map((cs) => ({
          criterion: cs.criterion,
          score: cs.score,
          weight: cs.weight,
        })),
        isCorrect: entity.isCorrect ?? undefined,
        tokensUsed: entity.tokensUsed,
        createdAt: entity.createdAt,
      },
      entity.id,
    );
  }
}
