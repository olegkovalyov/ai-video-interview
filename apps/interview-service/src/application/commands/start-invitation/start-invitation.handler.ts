import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { StartInvitationCommand } from './start-invitation.command';
import type { IInvitationRepository } from '../../../domain/repositories/invitation.repository.interface';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { InvitationNotFoundException } from '../../../domain/exceptions/invitation.exceptions';

@CommandHandler(StartInvitationCommand)
export class StartInvitationHandler
  implements ICommandHandler<StartInvitationCommand>
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

  async execute(command: StartInvitationCommand): Promise<void> {
    this.logger.info('Starting invitation', {
      action: 'StartInvitation',
      invitationId: command.invitationId,
      userId: command.userId,
    });

    // Find invitation
    const invitation = await this.invitationRepository.findById(
      command.invitationId,
    );
    if (!invitation) {
      throw new InvitationNotFoundException(command.invitationId);
    }

    // Start the invitation (domain method handles validation)
    // Domain exceptions (InvitationAccessDeniedException, InvitationExpiredException,
    // InvalidInvitationStateException) propagate to DomainExceptionFilter
    invitation.start(command.userId);

    // Atomic write: save aggregate + outbox event in single transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.invitationRepository.save(invitation, tx);
      return this.outboxService.saveEvent(
        'invitation.started',
        {
          invitationId: invitation.id,
          candidateId: invitation.candidateId,
          startedAt: invitation.startedAt!.toISOString(),
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

    this.logger.info('Invitation started successfully', {
      action: 'StartInvitation',
      invitationId: invitation.id,
    });
  }
}
