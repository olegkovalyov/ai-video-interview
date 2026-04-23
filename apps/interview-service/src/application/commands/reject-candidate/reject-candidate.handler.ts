import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RejectCandidateCommand } from './reject-candidate.command';
import type { IInvitationRepository } from '../../../domain/repositories/invitation.repository.interface';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import {
  InvitationAccessDeniedException,
  InvitationNotFoundException,
} from '../../../domain/exceptions/invitation.exceptions';

@CommandHandler(RejectCandidateCommand)
export class RejectCandidateHandler
  implements ICommandHandler<RejectCandidateCommand>
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

  async execute(command: RejectCandidateCommand): Promise<void> {
    const { invitationId, hrUserId, hrRole, note } = command;

    this.logger.info('Rejecting candidate', {
      action: 'RejectCandidate',
      invitationId,
      hrUserId,
    });

    const result =
      await this.invitationRepository.findByIdWithTemplate(invitationId);
    if (!result) {
      throw new InvitationNotFoundException(invitationId);
    }
    const { invitation, template } = result;

    if (hrRole !== 'admin' && invitation.invitedBy !== hrUserId) {
      throw new InvitationAccessDeniedException(
        'Only the HR user who invited the candidate can decide',
      );
    }

    invitation.reject(hrUserId, template.title, note);

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
      note,
      decidedAt: invitation.decisionAt!.toISOString(),
    };

    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.invitationRepository.save(invitation, tx);
      return this.outboxService.saveEvent(
        'candidate.rejected',
        outboxPayload as unknown as Record<string, unknown>,
        invitation.id,
        tx,
      );
    });

    const events = invitation.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    invitation.commit();
    await this.outboxService.schedulePublishing([eventId]);

    this.logger.info('Candidate rejected', {
      action: 'RejectCandidate',
      invitationId,
      candidateId: invitation.candidateId,
    });
  }
}
