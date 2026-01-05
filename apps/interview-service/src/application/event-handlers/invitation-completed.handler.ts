import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InvitationCompletedEvent } from '../../domain/events/invitation-completed.event';
import { OutboxService } from '../../infrastructure/messaging/outbox/outbox.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Event handler for InvitationCompletedEvent
 * 
 * Saves the event to outbox for publishing to interview-events Kafka topic.
 * This event will be consumed by AI Analysis Service to perform candidate analysis.
 */
@Injectable()
@EventsHandler(InvitationCompletedEvent)
export class InvitationCompletedHandler implements IEventHandler<InvitationCompletedEvent> {
  private readonly logger = new Logger(InvitationCompletedHandler.name);

  constructor(private readonly outboxService: OutboxService) {}

  async handle(event: InvitationCompletedEvent): Promise<void> {
    this.logger.log(`Handling InvitationCompletedEvent for invitation: ${event.aggregateId}`);

    // Build Kafka event payload (format expected by AI Analysis Service)
    const kafkaEvent = {
      eventId: uuidv4(),
      eventType: 'invitation.completed',
      timestamp: event.occurredOn.toISOString(),
      version: 1,
      payload: {
        invitationId: event.aggregateId,
        candidateId: event.candidateId,
        templateId: event.templateId,
        templateTitle: event.templateTitle,
        companyName: event.companyName,
        completedAt: event.completedAt.toISOString(),
        language: event.language,
        questions: event.questions,
        responses: event.responses,
      },
    };

    // Save to outbox for reliable publishing
    await this.outboxService.saveEvent(
      'invitation.completed',
      kafkaEvent,
      event.aggregateId,
    );

    this.logger.log(
      `InvitationCompletedEvent saved to outbox for invitation: ${event.aggregateId}, ` +
      `questions: ${event.questions.length}, responses: ${event.responses.length}`,
    );
  }
}
