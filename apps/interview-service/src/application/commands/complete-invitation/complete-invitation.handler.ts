import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CompleteInvitationCommand } from './complete-invitation.command';
import type { IInvitationRepository } from '../../../domain/repositories/invitation.repository.interface';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { InvitationNotFoundException } from '../../../domain/exceptions/invitation.exceptions';
import type { QuestionData } from '../../../domain/events/invitation-completed.event';

@CommandHandler(CompleteInvitationCommand)
export class CompleteInvitationHandler
  implements ICommandHandler<CompleteInvitationCommand>
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

  async execute(command: CompleteInvitationCommand): Promise<void> {
    this.logger.info('Completing invitation', {
      action: 'CompleteInvitation',
      invitationId: command.invitationId,
      reason: command.reason,
    });

    // Find invitation with template data (needed for AI Analysis)
    const result = await this.invitationRepository.findByIdWithTemplate(
      command.invitationId,
    );
    if (!result) {
      throw new InvitationNotFoundException(command.invitationId);
    }

    const { invitation, template } = result;

    // Map template questions to QuestionData format
    const questions: QuestionData[] = template.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      order: q.order,
      timeLimit: q.timeLimit,
    }));

    // Complete the invitation (domain method handles validation)
    // Domain exceptions (InvitationAccessDeniedException, InvalidInvitationStateException,
    // InvitationIncompleteException) propagate to DomainExceptionFilter
    invitation.complete({
      userId: command.userId,
      reason: command.reason,
      templateTitle: template.title,
      language: 'en', // TODO: get from invitation or template settings
      questions,
    });

    // Build outbox payload with full data for AI Analysis Service
    const responseData = invitation.responses.map((r) => ({
      questionId: r.questionId,
      text: r.getAnswer() || '',
      duration: r.duration,
    }));

    const outboxPayload = {
      invitationId: invitation.id,
      candidateId: invitation.candidateId,
      templateId: invitation.templateId,
      templateTitle: template.title,
      companyName: invitation.companyName,
      completedAt: invitation.completedAt!.toISOString(),
      language: 'en',
      questions,
      responses: responseData,
    };

    // Atomic write: save aggregate + outbox event in single transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.invitationRepository.save(invitation, tx);
      return this.outboxService.saveEvent(
        'invitation.completed',
        outboxPayload as unknown as Record<string, unknown>,
        invitation.id,
        tx,
      );
    });

    // Post-commit: publish domain events + schedule BullMQ
    const events = invitation.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    invitation.commit();
    await this.outboxService.schedulePublishing([eventId]);

    this.logger.info('Invitation completed successfully', {
      action: 'CompleteInvitation',
      invitationId: invitation.id,
      reason: command.reason,
    });
  }
}
