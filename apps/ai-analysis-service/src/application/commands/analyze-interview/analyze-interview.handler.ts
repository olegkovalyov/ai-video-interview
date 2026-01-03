import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
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
import { AnalysisAlreadyExistsException } from '../../../domain/exceptions/analysis.exceptions';
import { AnalysisResultResponse } from '../../dto/responses/analysis-result.response';
import { AnalysisResultMapper } from '../../mappers/analysis-result.mapper';

@CommandHandler(AnalyzeInterviewCommand)
export class AnalyzeInterviewHandler implements ICommandHandler<AnalyzeInterviewCommand> {
  private readonly logger = new Logger(AnalyzeInterviewHandler.name);

  constructor(
    @Inject(ANALYSIS_RESULT_REPOSITORY)
    private readonly repository: IAnalysisResultRepository,

    @Inject(ANALYSIS_ENGINE)
    private readonly analysisEngine: IAnalysisEngine,

    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,

    @Inject(PROMPT_LOADER)
    private readonly promptLoader: IPromptLoader,
  ) {}

  async execute(command: AnalyzeInterviewCommand): Promise<AnalysisResultResponse> {
    const { eventData } = command;
    const startTime = Date.now();
    let totalTokensUsed = 0;

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
    await this.repository.save(analysis);
    await this.publishDomainEvents(analysis);

    const language = eventData.language || 'en';
    const criteria = this.promptLoader.getCriteria();

    try {
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
        const criteriaScores = result.criteriaScores.map(cs => ({
          criterion: cs.criterion as CriterionType,
          score: cs.score,
          weight: criteria.find(c => c.name === cs.criterion)?.weight || 0.25,
        }));

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

      const processingTimeMs = Date.now() - startTime;

      analysis.complete({
        summary: summaryResult.summary,
        strengths: summaryResult.strengths,
        weaknesses: summaryResult.weaknesses,
        recommendation: summaryResult.recommendation,
        modelUsed: 'llama-3.3-70b-versatile',
        totalTokensUsed,
        processingTimeMs,
        language,
      });

      await this.repository.save(analysis);
      await this.publishDomainEvents(analysis);

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

      analysis.fail(errorMessage);
      await this.repository.save(analysis);
      await this.publishDomainEvents(analysis);

      throw error;
    }
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
      await this.eventPublisher.publish({
        eventId: event.eventId,
        eventType: event.constructor.name,
        aggregateId: event.aggregateId,
        occurredAt: event.occurredAt,
        payload: { ...event },
      });
    }
    analysis.clearEvents();
  }
}
