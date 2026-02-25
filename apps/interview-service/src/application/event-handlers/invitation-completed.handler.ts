import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { InvitationCompletedEvent } from '../../domain/events/invitation-completed.event';
import { LoggerService } from '../../infrastructure/logger/logger.service';

/**
 * Event handler for InvitationCompletedEvent
 *
 * Internal side effects only (logging, metrics).
 * Outbox save is now handled atomically inside CompleteInvitationHandler
 * via UnitOfWork (aggregate save + outbox save in same transaction).
 */
@Injectable()
@EventsHandler(InvitationCompletedEvent)
export class InvitationCompletedHandler implements IEventHandler<InvitationCompletedEvent> {
  constructor(private readonly logger: LoggerService) {}

  async handle(event: InvitationCompletedEvent): Promise<void> {
    this.logger.info(
      `InvitationCompleted: ${event.aggregateId}, questions: ${event.questions.length}, responses: ${event.responses.length}`,
      {
        action: 'invitation.completed',
        invitationId: event.aggregateId,
        candidateId: event.candidateId,
        templateId: event.templateId,
      },
    );
  }
}
