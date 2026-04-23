import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ApproveCandidateCommand } from './approve-candidate.command';
import type { IInvitationRepository } from '../../../domain/repositories/invitation.repository.interface';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import {
  InvitationAccessDeniedException,
  InvitationNotFoundException,
} from '../../../domain/exceptions/invitation.exceptions';

@CommandHandler(ApproveCandidateCommand)
export class ApproveCandidateHandler
  implements ICommandHandler<ApproveCandidateCommand>
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

  async execute(command: ApproveCandidateCommand): Promise<void> {
    const { invitationId, hrUserId, hrRole, note } = command;

    this.logger.info('Approving candidate', {
      action: 'ApproveCandidate',
      invitationId,
      hrUserId,
    });

    const result =
      await this.invitationRepository.findByIdWithTemplate(invitationId);
    if (!result) {
      throw new InvitationNotFoundException(invitationId);
    }
    const { invitation, template } = result;

    // Access control: only HR who invited the candidate, or admin
    if (hrRole !== 'admin' && invitation.invitedBy !== hrUserId) {
      throw new InvitationAccessDeniedException(
        'Only the HR user who invited the candidate can decide',
      );
    }

    // Domain method handles business rules
    invitation.approve(hrUserId, template.title, note);

    // Outbox payload for notification-service
    const outboxPayload = {
      invitationId: invitation.id,
      candidateId: invitation.candidateId,
      candidateEmail: invitation.candidateEmail,
      candidateName: invitation.candidateName,
      templateId: invitation.templateId,
      templateTitle: template.title,
      companyName: invitation.companyName,
      hrUserId,
      hrEmail: invitation.hrEmail,
      hrName: invitation.hrName,
      note: note || null,
      decidedAt: invitation.decisionAt!.toISOString(),
    };

    // Atomic save: aggregate + outbox event
    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.invitationRepository.save(invitation, tx);
      return this.outboxService.saveEvent(
        'candidate.approved',
        outboxPayload as unknown as Record<string, unknown>,
        invitation.id,
        tx,
      );
    });

    const events = invitation.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    invitation.commit();
    await this.outboxService.schedulePublishing([eventId]);

    this.logger.info('Candidate approved', {
      action: 'ApproveCandidate',
      invitationId,
      candidateId: invitation.candidateId,
    });
  }
}
