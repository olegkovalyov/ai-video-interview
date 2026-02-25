import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaService, KAFKA_TOPICS } from '@repo/shared';
import { AnalyzeInterviewCommand } from '../../../application/commands/analyze-interview/analyze-interview.command';
import { InvitationCompletedEventData } from '../../../application/dto/kafka/invitation-completed.event';
import { AnalysisAlreadyExistsException } from '../../../domain/exceptions/analysis.exceptions';
import { AnalysisResultEntity } from '../../persistence/entities/analysis-result.entity';
import { ProcessedEventEntity } from '../../persistence/entities/processed-event.entity';

interface InvitationCompletedKafkaEvent {
  eventId: string;
  eventType: string;
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
      options?: Array<{ id: string; text: string; isCorrect: boolean }>;
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

/**
 * Kafka consumer for invitation.completed events.
 *
 * Responsibilities (thin consumer):
 * 1. Parse and validate Kafka message
 * 2. Idempotency check (processed_events table)
 * 3. Delegate to CommandBus → AnalyzeInterviewHandler
 * 4. Mark event as processed
 *
 * All analysis logic lives in AnalyzeInterviewHandler (application layer).
 */
@Injectable()
export class InvitationCompletedConsumer implements OnModuleInit {
  private readonly logger = new Logger(InvitationCompletedConsumer.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
    private readonly commandBus: CommandBus,
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

          const event: InvitationCompletedKafkaEvent = JSON.parse(message.value.toString());

          if (event.eventType === 'invitation.completed') {
            await this.handleInvitationCompleted(event);
          } else {
            this.logger.debug(`Ignoring event type: ${event.eventType}`);
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Failed to process interview event: ${message}`, error instanceof Error ? error.stack : undefined);
        }
      },
      { fromBeginning: true, autoCommit: true },
    );

    this.logger.log('Subscribed to interview-events topic');
  }

  private async handleInvitationCompleted(event: InvitationCompletedKafkaEvent): Promise<void> {
    const { payload } = event;

    // 1. Idempotency check (best-effort — race condition possible during long analysis)
    const alreadyProcessed = await this.processedEventRepo.findOne({
      where: { eventId: event.eventId, serviceName: 'ai-analysis-service' },
    });
    if (alreadyProcessed) {
      this.logger.log(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    // 2. Check if analysis already exists for this invitation
    const existingAnalysis = await this.analysisResultRepo.findOne({
      where: { invitationId: payload.invitationId },
    });
    if (existingAnalysis) {
      this.logger.log(`Analysis for invitation ${payload.invitationId} already exists, skipping`);
      return;
    }

    this.logger.log(
      `Received invitation.completed: invitation=${payload.invitationId}, ` +
      `template="${payload.templateTitle}", questions=${payload.questions.length}`,
    );

    // 3. Delegate to CQRS handler
    const eventData: InvitationCompletedEventData = {
      invitationId: payload.invitationId,
      candidateId: payload.candidateId,
      templateId: payload.templateId,
      templateTitle: payload.templateTitle,
      companyName: payload.companyName,
      completedAt: new Date(payload.completedAt),
      questions: payload.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        orderIndex: q.orderIndex,
        options: q.options,
      })),
      responses: payload.responses.map((r) => ({
        id: r.id,
        questionId: r.questionId,
        textAnswer: r.textAnswer,
        selectedOptionId: r.selectedOptionId,
        submittedAt: new Date(),
      })),
      language: payload.language,
    };

    try {
      await this.commandBus.execute(new AnalyzeInterviewCommand(eventData));
    } catch (error) {
      // Race condition: duplicate message arrived during long-running analysis.
      // Handler's existsByInvitationId check caught it — treat as idempotent success.
      if (error instanceof AnalysisAlreadyExistsException) {
        this.logger.log(`Duplicate analysis for invitation ${payload.invitationId} detected, treating as success`);
      } else {
        throw error;
      }
    }

    // 4. Mark event as processed — use INSERT with conflict handling for race safety
    try {
      const processedEvent = new ProcessedEventEntity();
      processedEvent.eventId = event.eventId;
      processedEvent.serviceName = 'ai-analysis-service';
      await this.processedEventRepo.save(processedEvent);
    } catch (error: unknown) {
      // Unique constraint violation (23505) = another consumer instance already marked it
      const isUniqueViolation = error instanceof Error && 'code' in error && (error as any).code === '23505';
      if (isUniqueViolation) {
        this.logger.log(`Event ${event.eventId} already marked as processed by another instance`);
      } else {
        throw error;
      }
    }

    this.logger.log(`Event ${event.eventId} processed successfully`);
  }
}
