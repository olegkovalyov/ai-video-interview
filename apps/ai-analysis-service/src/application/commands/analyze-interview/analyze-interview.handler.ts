import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../../../infrastructure/metrics/metrics.service';
import { AnalyzeInterviewCommand } from './analyze-interview.command';
import { ANALYSIS_RESULT_REPOSITORY } from '../../ports';
import type { IAnalysisResultRepository } from '../../ports';
import { ANALYSIS_ENGINE } from '../../ports/analysis-engine.port';
import type { IAnalysisEngine, QuestionAnalysisInput } from '../../ports/analysis-engine.port';
import { EVENT_PUBLISHER } from '../../ports/event-publisher.port';
import type { IEventPublisher } from '../../ports/event-publisher.port';
import { PROMPT_LOADER } from '../../ports/prompt-loader.port';
import type { IPromptLoader } from '../../ports/prompt-loader.port';
import { AnalysisResult } from '../../../domain/aggregates/analysis-result.aggregate';
import { QuestionType } from '../../../domain/value-objects/question-type.vo';
import { CriterionType } from '../../../domain/value-objects/criteria-score.vo';
import { AnalysisAlreadyExistsException, InvalidCriterionTypeException } from '../../../domain/exceptions/analysis.exceptions';
import { AnalysisStartedEvent } from '../../../domain/events/analysis-started.event';
import { AnalysisCompletedEvent } from '../../../domain/events/analysis-completed.event';
import { AnalysisFailedEvent } from '../../../domain/events/analysis-failed.event';
import { AnalysisResultResponse } from '../../dto/responses/analysis-result.response';
import { AnalysisResultMapper } from '../../mappers/analysis-result.mapper';

/** Maps domain event class → Kafka contract event type (dotted lowercase) */
const EVENT_TYPE_MAP = new Map<Function, string>([
  [AnalysisStartedEvent, 'analysis.started'],
  [AnalysisCompletedEvent, 'analysis.completed'],
  [AnalysisFailedEvent, 'analysis.failed'],
]);

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const ANALYSIS_TIMEOUT_MS = 600_000; // 10 minutes

@CommandHandler(AnalyzeInterviewCommand)
export class AnalyzeInterviewHandler implements ICommandHandler<AnalyzeInterviewCommand> {
  private readonly logger = new Logger(AnalyzeInterviewHandler.name);
  private readonly modelName: string;

  constructor(
    @Inject(ANALYSIS_RESULT_REPOSITORY)
    private readonly repository: IAnalysisResultRepository,

    @Inject(ANALYSIS_ENGINE)
    private readonly analysisEngine: IAnalysisEngine,

    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,

    @Inject(PROMPT_LOADER)
    private readonly promptLoader: IPromptLoader,

    configService: ConfigService,

    @Optional() private readonly metricsService?: MetricsService,
  ) {
    this.modelName = configService.get<string>('GROQ_MODEL', DEFAULT_MODEL);
  }

  async execute(command: AnalyzeInterviewCommand): Promise<AnalysisResultResponse> {
    const { eventData } = command;
    const startTime = Date.now();

    this.logger.log(`Starting analysis for invitation: ${eventData.invitationId}`);

    const exists = await this.repository.existsByInvitationId(eventData.invitationId);
    if (exists) {
      throw new AnalysisAlreadyExistsException(eventData.invitationId);
    }

    const analysis = AnalysisResult.create({
      invitationId: eventData.invitationId,
      candidateId: eventData.candidateId,
      templateId: eventData.templateId,
      templateTitle: eventData.templateTitle,
      companyName: eventData.companyName,
    });

    analysis.start();
    await this.repository.save(analysis, eventData as unknown as Record<string, unknown>);
    await this.publishDomainEvents(analysis);

    const language = eventData.language || 'en';
    const criteria = this.promptLoader.getCriteria();

    try {
      const result = await this.withTimeout(
        this.performAnalysis(analysis, eventData, criteria, language),
        ANALYSIS_TIMEOUT_MS,
        `Analysis timeout after ${ANALYSIS_TIMEOUT_MS / 1000}s for invitation: ${eventData.invitationId}`,
      );

      const { totalTokensUsed, summaryResult } = result;
      const processingTimeMs = Date.now() - startTime;

      // Validate LLM recommendation against calculated score
      const currentScore = analysis.questionAnalyses.length > 0
        ? Math.round(analysis.questionAnalyses.reduce((sum, qa) => sum + qa.score.value, 0) / analysis.questionAnalyses.length)
        : 0;
      const llmRecommendation = summaryResult.recommendation;
      const scoreBasedRecommendation = currentScore >= 75 ? 'hire' : currentScore >= 50 ? 'consider' : 'reject';

      if (llmRecommendation !== scoreBasedRecommendation) {
        this.logger.warn(
          `LLM recommendation '${llmRecommendation}' conflicts with score-based '${scoreBasedRecommendation}' ` +
          `(score: ${currentScore}) for invitation: ${eventData.invitationId}. Using LLM recommendation.`
        );
      }

      analysis.complete({
        summary: summaryResult.summary,
        strengths: summaryResult.strengths,
        weaknesses: summaryResult.weaknesses,
        recommendation: summaryResult.recommendation,
        modelUsed: this.modelName,
        totalTokensUsed,
        processingTimeMs,
        language,
      });

      await this.repository.save(analysis);
      await this.publishDomainEvents(analysis);

      this.metricsService?.recordAnalysis('completed', this.modelName, processingTimeMs);

      this.logger.log(
        `Analysis completed for invitation: ${eventData.invitationId}, ` +
        `score: ${analysis.overallScore?.value}, ` +
        `tokens: ${totalTokensUsed}, ` +
        `time: ${processingTimeMs}ms`
      );

      return AnalysisResultMapper.toResponse(analysis);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Analysis failed for invitation: ${eventData.invitationId}`, error);

      const failedProcessingTimeMs = Date.now() - startTime;
      this.metricsService?.recordAnalysis('failed', this.modelName, failedProcessingTimeMs);

      analysis.fail(errorMessage);
      await this.repository.save(analysis);
      await this.publishDomainEvents(analysis);

      throw error;
    }
  }

  private async performAnalysis(
    analysis: AnalysisResult,
    eventData: AnalyzeInterviewCommand['eventData'],
    criteria: ReturnType<IPromptLoader['getCriteria']>,
    language: string,
  ): Promise<{ totalTokensUsed: number; summaryResult: Awaited<ReturnType<IAnalysisEngine['generateSummary']>> }> {
    let totalTokensUsed = 0;

    for (const response of eventData.responses) {
      const question = eventData.questions.find(q => q.id === response.questionId);
      if (!question) {
        this.logger.warn(`Question not found for response: ${response.questionId}`);
        continue;
      }

      const responseText = this.getResponseText(response, question);
      if (!responseText) {
        this.logger.warn(`Empty response for question: ${question.id}`);
        continue;
      }

      const correctAnswer = this.getCorrectAnswer(question);

      const input: QuestionAnalysisInput = {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        responseText,
        correctAnswer,
      };

      this.logger.debug(`Analyzing question: ${question.id}`);
      const result = await this.analysisEngine.analyzeResponse(input);
      totalTokensUsed += result.tokensUsed;

      const questionType = QuestionType.fromString(question.type);
      const validCriteria = Object.values(CriterionType) as string[];
      const criteriaScores = result.criteriaScores.map(cs => {
        if (!validCriteria.includes(cs.criterion)) {
          throw new InvalidCriterionTypeException(cs.criterion);
        }
        return {
          criterion: cs.criterion as CriterionType,
          score: cs.score,
          weight: criteria.find(c => c.name === cs.criterion)?.weight || 0.25,
        };
      });

      analysis.addQuestionAnalysis({
        questionId: question.id,
        questionText: question.text,
        questionType,
        responseText,
        score: result.score,
        feedback: result.feedback,
        criteriaScores,
        isCorrect: questionType.isMultipleChoice ? this.checkMultipleChoiceAnswer(response, question) : undefined,
        tokensUsed: result.tokensUsed,
      });
    }

    this.logger.debug('Generating summary...');
    const summaryInput = {
      questionAnalyses: analysis.questionAnalyses.map(qa => ({
        questionText: qa.questionText,
        responseText: qa.responseText,
        score: qa.score.value,
        feedback: qa.feedback,
      })),
      templateTitle: eventData.templateTitle,
      companyName: eventData.companyName,
    };

    const summaryResult = await this.analysisEngine.generateSummary(summaryInput);
    totalTokensUsed += summaryResult.tokensUsed;

    return { totalTokensUsed, summaryResult };
  }

  private withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  private getResponseText(
    response: { textAnswer?: string; selectedOptionId?: string },
    question: { options?: Array<{ id: string; text: string }> },
  ): string {
    if (response.textAnswer) {
      return response.textAnswer;
    }

    if (response.selectedOptionId && question.options) {
      const selectedOption = question.options.find(o => o.id === response.selectedOptionId);
      return selectedOption?.text || '';
    }

    return '';
  }

  private getCorrectAnswer(
    question: { type: string; options?: Array<{ text: string; isCorrect: boolean }> },
  ): string | undefined {
    if (question.type === 'multiple_choice' && question.options) {
      const correctOption = question.options.find(o => o.isCorrect);
      return correctOption?.text;
    }
    return undefined;
  }

  private checkMultipleChoiceAnswer(
    response: { selectedOptionId?: string },
    question: { options?: Array<{ id: string; isCorrect: boolean }> },
  ): boolean {
    if (!response.selectedOptionId || !question.options) {
      return false;
    }
    const selectedOption = question.options.find(o => o.id === response.selectedOptionId);
    return selectedOption?.isCorrect || false;
  }

  private async publishDomainEvents(analysis: AnalysisResult): Promise<void> {
    for (const event of analysis.domainEvents) {
      const eventType = EVENT_TYPE_MAP.get(event.constructor);
      if (!eventType) {
        this.logger.warn(`Unknown event type: ${event.constructor.name}, skipping publish`);
        continue;
      }
      await this.eventPublisher.publish({
        eventId: event.eventId,
        eventType,
        aggregateId: event.aggregateId,
        occurredAt: event.occurredAt,
        payload: { ...event },
      });
    }
    analysis.clearEvents();
  }
}
