import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaService, KAFKA_TOPICS, AnalysisCompletedEvent } from '@repo/shared';
import { ANALYSIS_ENGINE } from '../../../application/ports/analysis-engine.port';
import type { IAnalysisEngine, QuestionAnalysisInput } from '../../../application/ports/analysis-engine.port';
import { AnalysisResultEntity } from '../../persistence/entities/analysis-result.entity';
import { QuestionAnalysisEntity } from '../../persistence/entities/question-analysis.entity';
import { ProcessedEventEntity } from '../../persistence/entities/processed-event.entity';
import { randomUUID } from 'crypto';

interface InvitationCompletedEvent {
  eventId: string;
  eventType: 'invitation.completed';
  timestamp: string;
  version: number;
  payload: {
    invitationId: string;
    candidateId: string;
    templateId: string;
    templateTitle: string;
    companyName: string;
    completedAt: string;
    questions: Array<{
      id: string;
      text: string;
      type: string;
      orderIndex: number;
      options?: Array<{
        id: string;
        text: string;
        isCorrect: boolean;
      }>;
    }>;
    responses: Array<{
      id: string;
      questionId: string;
      textAnswer?: string;
      selectedOptionId?: string;
    }>;
    language?: string;
  };
}

@Injectable()
export class InvitationCompletedConsumer implements OnModuleInit {
  private readonly logger = new Logger(InvitationCompletedConsumer.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
    @Inject(ANALYSIS_ENGINE) private readonly analysisEngine: IAnalysisEngine,
    @InjectRepository(AnalysisResultEntity)
    private readonly analysisResultRepo: Repository<AnalysisResultEntity>,
    @InjectRepository(ProcessedEventEntity)
    private readonly processedEventRepo: Repository<ProcessedEventEntity>,
  ) {}

  async onModuleInit() {
    this.logger.log('Subscribing to interview-events topic...');

    await this.kafkaService.subscribe(
      KAFKA_TOPICS.INTERVIEW_EVENTS,
      'ai-analysis-service-invitation-consumer',
      async (message) => {
        try {
          if (!message.value) {
            this.logger.warn('Received message with null value');
            return;
          }

          const event: InvitationCompletedEvent = JSON.parse(message.value.toString());

          if (event.eventType === 'invitation.completed') {
            await this.handleInvitationCompleted(event);
          } else {
            this.logger.debug(`Ignoring event type: ${event.eventType}`);
          }
        } catch (error: any) {
          this.logger.error(`Failed to process interview event: ${error.message}`, error.stack);
        }
      },
      { fromBeginning: true, autoCommit: true },
    );

    this.logger.log('✅ Subscribed to interview-events topic');
  }

  private async handleInvitationCompleted(event: InvitationCompletedEvent): Promise<void> {
    const { payload } = event;
    const startTime = Date.now();

    // Check idempotency
    const alreadyProcessed = await this.processedEventRepo.findOne({
      where: { eventId: event.eventId, serviceName: 'ai-analysis-service' },
    });
    if (alreadyProcessed) {
      this.logger.log(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    // Check if analysis already exists for this invitation
    const existingAnalysis = await this.analysisResultRepo.findOne({
      where: { invitationId: payload.invitationId },
    });
    if (existingAnalysis) {
      this.logger.log(`Analysis for invitation ${payload.invitationId} already exists, skipping`);
      return;
    }

    this.logger.log('='.repeat(60));
    this.logger.log(`📥 RECEIVED: invitation.completed`);
    this.logger.log(`   Invitation: ${payload.invitationId}`);
    this.logger.log(`   Template: ${payload.templateTitle}`);
    this.logger.log(`   Questions: ${payload.questions.length}`);
    this.logger.log('='.repeat(60));

    // Create analysis result entity
    const analysisResult = new AnalysisResultEntity();
    analysisResult.invitationId = payload.invitationId;
    analysisResult.candidateId = payload.candidateId;
    analysisResult.templateId = payload.templateId;
    analysisResult.templateTitle = payload.templateTitle;
    analysisResult.companyName = payload.companyName;
    analysisResult.status = 'in_progress';
    analysisResult.language = payload.language || 'en';
    analysisResult.modelUsed = 'openai/gpt-oss-120b';

    // Save initial record
    await this.analysisResultRepo.save(analysisResult);
    this.logger.log(`Created analysis record: ${analysisResult.id}`);

    let totalTokensUsed = 0;
    const questionAnalysisEntities: QuestionAnalysisEntity[] = [];

    try {
      for (const response of payload.responses) {
        const question = payload.questions.find(q => q.id === response.questionId);
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

        this.logger.log(`\n--- Analyzing Question: ${question.id} ---`);
        this.logger.log(`Q: ${question.text.substring(0, 80)}...`);

        // Rate limit: wait between LLM calls to avoid 429 errors (Groq free tier: 8000 TPM)
        await this.delay(5000);

        const result = await this.analysisEngine.analyzeResponse(input);
        totalTokensUsed += result.tokensUsed;

        this.logger.log(`Score: ${result.score}/100 | Tokens: ${result.tokensUsed}`);

        const qaEntity = new QuestionAnalysisEntity();
        qaEntity.analysisResultId = analysisResult.id;
        qaEntity.questionId = question.id;
        qaEntity.questionText = question.text;
        qaEntity.questionType = question.type as any;
        qaEntity.responseText = responseText;
        qaEntity.score = result.score;
        qaEntity.feedback = result.feedback;
        qaEntity.criteriaScores = result.criteriaScores;
        qaEntity.tokensUsed = result.tokensUsed;
        qaEntity.isCorrect = question.type === 'multiple_choice' ? result.score >= 90 : null;

        questionAnalysisEntities.push(qaEntity);
      }

      this.logger.log('\n' + '='.repeat(60));
      this.logger.log('GENERATING SUMMARY...');

      const summaryResult = await this.analysisEngine.generateSummary({
        questionAnalyses: questionAnalysisEntities.map(qa => ({
          questionText: qa.questionText,
          responseText: qa.responseText,
          score: qa.score,
          feedback: qa.feedback,
        })),
        templateTitle: payload.templateTitle,
        companyName: payload.companyName,
      });

      totalTokensUsed += summaryResult.tokensUsed;
      const processingTime = Date.now() - startTime;

      const overallScore = questionAnalysisEntities.length > 0
        ? Math.round(questionAnalysisEntities.reduce((sum, qa) => sum + qa.score, 0) / questionAnalysisEntities.length)
        : 0;

      // Update analysis result with final data
      analysisResult.status = 'completed';
      analysisResult.overallScore = overallScore;
      analysisResult.summary = summaryResult.summary;
      analysisResult.strengths = summaryResult.strengths;
      analysisResult.weaknesses = summaryResult.weaknesses;
      analysisResult.recommendation = summaryResult.recommendation as any;
      analysisResult.totalTokensUsed = totalTokensUsed;
      analysisResult.processingTimeMs = processingTime;
      analysisResult.completedAt = new Date();
      analysisResult.questionAnalyses = questionAnalysisEntities;

      await this.analysisResultRepo.save(analysisResult);

      // Mark event as processed
      const processedEvent = new ProcessedEventEntity();
      processedEvent.eventId = event.eventId;
      processedEvent.serviceName = 'ai-analysis-service';
      await this.processedEventRepo.save(processedEvent);

      this.logger.log('='.repeat(60));
      this.logger.log('✅ ANALYSIS COMPLETED & SAVED TO DATABASE');
      this.logger.log(`   Analysis ID: ${analysisResult.id}`);
      this.logger.log(`   Invitation: ${payload.invitationId}`);
      this.logger.log(`   Overall Score: ${overallScore}/100`);
      this.logger.log(`   Recommendation: ${summaryResult.recommendation.toUpperCase()}`);
      this.logger.log(`   Processing Time: ${processingTime}ms`);
      this.logger.log(`   Tokens Used: ${totalTokensUsed}`);
      this.logger.log('='.repeat(60));

      // Publish analysis.completed event
      await this.publishAnalysisCompletedEvent(analysisResult, questionAnalysisEntities.length);

    } catch (error: any) {
      // Update status to failed
      analysisResult.status = 'failed';
      analysisResult.errorMessage = error.message;
      analysisResult.processingTimeMs = Date.now() - startTime;
      await this.analysisResultRepo.save(analysisResult);

      this.logger.error(`Analysis failed for ${payload.invitationId}: ${error.message}`, error.stack);
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async publishAnalysisCompletedEvent(
    analysis: AnalysisResultEntity,
    questionsAnalyzed: number,
  ): Promise<void> {
    const event: AnalysisCompletedEvent = {
      eventId: `analysis-${randomUUID()}`,
      eventType: 'analysis.completed',
      timestamp: new Date().toISOString(),
      version: 1,
      payload: {
        analysisId: analysis.id,
        invitationId: analysis.invitationId,
        candidateId: analysis.candidateId,
        templateId: analysis.templateId,
        templateTitle: analysis.templateTitle,
        companyName: analysis.companyName,
        status: analysis.status as 'completed' | 'failed',
        overallScore: analysis.overallScore,
        recommendation: analysis.recommendation,
        questionsAnalyzed,
        processingTimeMs: analysis.processingTimeMs,
        totalTokensUsed: analysis.totalTokensUsed,
      },
    };

    try {
      await this.kafkaService.publishEvent(
        KAFKA_TOPICS.ANALYSIS_EVENTS,
        event,
        undefined,
        { partitionKey: analysis.candidateId },
      );
      this.logger.log(`📤 Published analysis.completed event to ${KAFKA_TOPICS.ANALYSIS_EVENTS}`);
    } catch (error: any) {
      this.logger.error(`Failed to publish analysis.completed event: ${error.message}`);
    }
  }
}
