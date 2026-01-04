import { Controller, Get, Param, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalysisResultEntity } from '../../persistence/entities/analysis-result.entity';

@Controller('api/v1/analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(
    @InjectRepository(AnalysisResultEntity)
    private readonly analysisResultRepo: Repository<AnalysisResultEntity>,
  ) {}

  @Get('status/:invitationId')
  async getStatus(@Param('invitationId') invitationId: string) {
    this.logger.debug(`Getting status for invitation: ${invitationId}`);

    const analysis = await this.analysisResultRepo.findOne({
      where: { invitationId },
      select: ['id', 'invitationId', 'status', 'createdAt', 'updatedAt'],
    });

    if (!analysis) {
      return {
        found: false,
        invitationId,
        status: 'not_found',
      };
    }

    return {
      found: true,
      id: analysis.id,
      invitationId: analysis.invitationId,
      status: analysis.status,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
    };
  }

  @Get(':invitationId')
  async getAnalysis(@Param('invitationId') invitationId: string) {
    this.logger.debug(`Getting analysis for invitation: ${invitationId}`);

    const analysis = await this.analysisResultRepo.findOne({
      where: { invitationId },
      relations: ['questionAnalyses'],
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis not found for invitation: ${invitationId}`);
    }

    return {
      id: analysis.id,
      invitationId: analysis.invitationId,
      candidateId: analysis.candidateId,
      templateId: analysis.templateId,
      templateTitle: analysis.templateTitle,
      companyName: analysis.companyName,
      status: analysis.status,
      overallScore: analysis.overallScore,
      summary: analysis.summary,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      recommendation: analysis.recommendation,
      language: analysis.language,
      modelUsed: analysis.modelUsed,
      totalTokensUsed: analysis.totalTokensUsed,
      processingTimeMs: analysis.processingTimeMs,
      errorMessage: analysis.errorMessage,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
      completedAt: analysis.completedAt,
      questionAnalyses: analysis.questionAnalyses?.map(qa => ({
        id: qa.id,
        questionId: qa.questionId,
        questionText: qa.questionText,
        questionType: qa.questionType,
        responseText: qa.responseText,
        score: qa.score,
        feedback: qa.feedback,
        criteriaScores: qa.criteriaScores,
        isCorrect: qa.isCorrect,
      })) || [],
    };
  }
}
