import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SubmitResponseCommand } from './submit-response.command';
import { Response } from '../../../domain/entities/response.entity';
import { ResponseType } from '../../../domain/value-objects/response-type.vo';
import type { IInvitationRepository } from '../../../domain/repositories/invitation.repository.interface';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { InvitationNotFoundException } from '../../../domain/exceptions/invitation.exceptions';

@CommandHandler(SubmitResponseCommand)
export class SubmitResponseHandler
  implements ICommandHandler<SubmitResponseCommand>
{
  constructor(
    @Inject('IInvitationRepository')
    private readonly invitationRepository: IInvitationRepository,
    private readonly eventBus: EventBus,
    @Inject('IOutboxService')
    private readonly outboxService: IOutboxService,
    @Inject('IUnitOfWork')
    private readonly unitOfWork: IUnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: SubmitResponseCommand): Promise<string> {
    this.logger.info('Submitting response', {
      action: 'SubmitResponse',
      invitationId: command.invitationId,
      questionId: command.questionId,
    });

    // Find invitation
    const invitation = await this.invitationRepository.findById(
      command.invitationId,
    );
    if (!invitation) {
      throw new InvitationNotFoundException(command.invitationId);
    }

    // Create response entity
    const responseId = uuidv4();
    const response = Response.create(responseId, {
      invitationId: command.invitationId,
      questionId: command.questionId,
      questionIndex: command.questionIndex,
      questionText: command.questionText,
      responseType: ResponseType.create(command.responseType),
      textAnswer: command.textAnswer,
      codeAnswer: command.codeAnswer,
      videoUrl: command.videoUrl,
      duration: command.duration,
    });

    // Submit response (domain method handles validation)
    // Domain exceptions (InvitationAccessDeniedException, InvitationExpiredException,
    // InvalidInvitationStateException, DuplicateResponseException) propagate to DomainExceptionFilter
    invitation.submitResponse(command.userId, response);

    // Atomic write: save aggregate + outbox event in single transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.invitationRepository.save(invitation, tx);
      return this.outboxService.saveEvent(
        'invitation.response.submitted',
        {
          invitationId: invitation.id,
          questionId: command.questionId,
          responseType: command.responseType,
        },
        invitation.id,
        tx,
      );
    });

    // Post-commit: publish domain events + schedule BullMQ
    const events = invitation.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    invitation.commit();
    await this.outboxService.schedulePublishing([eventId]);

    // Update last activity (side operation, outside transaction)
    await this.invitationRepository.updateLastActivity(invitation.id);

    this.logger.info('Response submitted successfully', {
      action: 'SubmitResponse',
      invitationId: invitation.id,
      responseId,
    });
    return responseId;
  }
}
