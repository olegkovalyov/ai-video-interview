import { Controller, Get, Param, NotFoundException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalysisResultEntity } from '../../persistence/entities/analysis-result.entity';

@ApiTags('Analysis')
@Controller('api/v1/analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(
    @InjectRepository(AnalysisResultEntity)
    private readonly analysisResultRepo: Repository<AnalysisResultEntity>,
  ) {}

  @Get('status/:invitationId')
  @ApiOperation({ 
    summary: 'Get analysis status',
    description: 'Returns the processing status of an analysis for a given invitation. Returns status "not_found" if no analysis exists.',
  })
  @ApiParam({ name: 'invitationId', description: 'Invitation UUID', type: 'string', format: 'uuid' })
  @ApiResponse({ 
    status: 200, 
    description: 'Analysis status',
    schema: {
      type: 'object',
      properties: {
        found: { type: 'boolean', example: true },
        id: { type: 'string', format: 'uuid' },
        invitationId: { type: 'string', format: 'uuid' },
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'failed'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
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
  @ApiOperation({ 
    summary: 'Get full analysis results',
    description: 'Returns complete analysis results including overall score, summary, strengths, weaknesses, recommendation, and individual question analyses.',
  })
  @ApiParam({ name: 'invitationId', description: 'Invitation UUID', type: 'string', format: 'uuid' })
  @ApiResponse({ 
    status: 200, 
    description: 'Full analysis results',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        invitationId: { type: 'string', format: 'uuid' },
        candidateId: { type: 'string', format: 'uuid' },
        templateId: { type: 'string', format: 'uuid' },
        templateTitle: { type: 'string', example: 'Frontend Developer Interview' },
        companyName: { type: 'string', example: 'TechCorp' },
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'failed'] },
        overallScore: { type: 'number', example: 85 },
        summary: { type: 'string', example: 'Strong candidate with excellent technical skills...' },
        strengths: { type: 'array', items: { type: 'string' }, example: ['Technical knowledge', 'Problem solving'] },
        weaknesses: { type: 'array', items: { type: 'string' }, example: ['Communication', 'Time management'] },
        recommendation: { type: 'string', enum: ['strongly_recommend', 'recommend', 'consider', 'not_recommend'] },
        language: { type: 'string', example: 'en' },
        modelUsed: { type: 'string', example: 'llama-3.3-70b-versatile' },
        totalTokensUsed: { type: 'number', example: 5000 },
        processingTimeMs: { type: 'number', example: 15000 },
        errorMessage: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        completedAt: { type: 'string', format: 'date-time', nullable: true },
        questionAnalyses: { 
          type: 'array', 
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              questionId: { type: 'string', format: 'uuid' },
              questionText: { type: 'string' },
              questionType: { type: 'string' },
              responseText: { type: 'string' },
              score: { type: 'number', example: 80 },
              feedback: { type: 'string' },
              criteriaScores: { type: 'array', items: { type: 'object' } },
              isCorrect: { type: 'boolean', nullable: true },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
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
