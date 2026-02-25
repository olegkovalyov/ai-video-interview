import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaService, KAFKA_TOPICS, AnalysisCompletedEvent } from '@repo/shared';
import { InvitationEntity } from '../../persistence/entities/invitation.entity';
import { LoggerService } from '../../logger/logger.service';

/**
 * Analysis Completed Consumer
 *
 * Consumes analysis.completed events from AI Analysis Service
 * and updates invitation records with analysis results.
 */
@Injectable()
export class AnalysisCompletedConsumer implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
    @InjectRepository(InvitationEntity)
    private readonly invitationRepo: Repository<InvitationEntity>,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    this.logger.info('Initializing Analysis Completed Consumer');
    // Subscribe in background - don't block app startup
    this.subscribeWithRetry();
  }

  private async subscribeWithRetry(): Promise<void> {
    const maxRetries = 5;
    const retryDelay = 5000; // 5 seconds

    this.logger.info(`Starting subscription to ${KAFKA_TOPICS.ANALYSIS_EVENTS}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.info(`Subscribe attempt ${attempt}/${maxRetries}`);
        // Use unique groupId - each consumer needs its own group
        await this.kafkaService.subscribe(
          KAFKA_TOPICS.ANALYSIS_EVENTS,
          'interview-service-analysis',
          async (message) => {
            try {
              const event = JSON.parse(message.value?.toString() || '{}');

              if (event.eventType === 'analysis.completed') {
                await this.handleAnalysisCompleted(event as AnalysisCompletedEvent);
              } else if (event.eventType === 'analysis.failed') {
                await this.handleAnalysisFailed(event);
              }
            } catch (error) {
              this.logger.error('Failed to process analysis event:', error);
            }
          },
          { fromBeginning: false, autoCommit: true },
        );

        this.logger.info('Subscribed to analysis-events topic');
        return;
      } catch (error) {
        this.logger.warn(
          `Failed to subscribe to analysis-events (attempt ${attempt}/${maxRetries}): ${error.message}`,
        );

        if (attempt < maxRetries) {
          this.logger.info(`Retrying in ${retryDelay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          this.logger.error(
            'Could not subscribe to analysis-events after max retries. ' +
            'Analysis results will not be received. Create the topic and restart the service.',
          );
        }
      }
    }
  }

  private async handleAnalysisCompleted(event: AnalysisCompletedEvent): Promise<void> {
    const { payload } = event;

    this.logger.info(`Received analysis.completed for invitation: ${payload.invitationId}`, {
      action: 'analysis_completed',
      invitationId: payload.invitationId,
      score: payload.overallScore,
      recommendation: payload.recommendation,
    });

    // Find and update invitation
    const invitation = await this.invitationRepo.findOne({
      where: { id: payload.invitationId },
    });

    if (!invitation) {
      this.logger.warn(`Invitation not found: ${payload.invitationId}`);
      return;
    }

    // Update invitation with analysis results
    invitation.analysisId = payload.analysisId;
    invitation.analysisStatus = payload.status;
    invitation.analysisScore = payload.overallScore;
    invitation.analysisRecommendation = payload.recommendation;
    invitation.analysisCompletedAt = new Date(event.timestamp);
    invitation.updatedAt = new Date();

    await this.invitationRepo.save(invitation);

    this.logger.info(`Updated invitation ${payload.invitationId} with analysis results`);
  }

  private async handleAnalysisFailed(event: any): Promise<void> {
    const { payload } = event;

    this.logger.warn(`Received analysis.failed for invitation: ${payload.invitationId}`, {
      action: 'analysis_failed',
      invitationId: payload.invitationId,
      error: payload.errorMessage,
    });

    // Find and update invitation
    const invitation = await this.invitationRepo.findOne({
      where: { id: payload.invitationId },
    });

    if (!invitation) {
      this.logger.warn(`Invitation not found: ${payload.invitationId}`);
      return;
    }

    // Update invitation with failed status
    invitation.analysisId = payload.analysisId;
    invitation.analysisStatus = 'failed';
    invitation.analysisErrorMessage = payload.errorMessage;
    invitation.updatedAt = new Date();

    await this.invitationRepo.save(invitation);

    this.logger.info(`Updated invitation ${payload.invitationId} with analysis failure`);
  }
}
