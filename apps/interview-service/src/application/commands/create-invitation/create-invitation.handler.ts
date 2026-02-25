import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateInvitationCommand } from './create-invitation.command';
import { Invitation } from '../../../domain/aggregates/invitation.aggregate';
import type { IInvitationRepository } from '../../../domain/repositories/invitation.repository.interface';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { TemplateNotFoundException } from '../../../domain/exceptions/interview-template.exceptions';
import {
  InvalidInvitationDataException,
  DuplicateInvitationException,
} from '../../../domain/exceptions/invitation.exceptions';

@CommandHandler(CreateInvitationCommand)
export class CreateInvitationHandler
  implements ICommandHandler<CreateInvitationCommand>
{
  constructor(
    @Inject('IInvitationRepository')
    private readonly invitationRepository: IInvitationRepository,
    @Inject('IInterviewTemplateRepository')
    private readonly templateRepository: IInterviewTemplateRepository,
    private readonly eventBus: EventBus,
    @Inject('IOutboxService')
    private readonly outboxService: IOutboxService,
    @Inject('IUnitOfWork')
    private readonly unitOfWork: IUnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: CreateInvitationCommand): Promise<string> {
    this.logger.info('Creating invitation', {
      action: 'CreateInvitation',
      candidateId: command.candidateId,
      templateId: command.templateId,
    });

    // Verify template exists and is active
    const template = await this.templateRepository.findById(command.templateId);
    if (!template) {
      throw new TemplateNotFoundException(command.templateId);
    }

    if (!template.status.isActive()) {
      throw new InvalidInvitationDataException('Template is not active');
    }

    // Check for duplicate invitation
    const exists = await this.invitationRepository.existsByCandidateAndTemplate(
      command.candidateId,
      command.templateId,
    );
    if (exists) {
      throw new DuplicateInvitationException(
        command.candidateId,
        command.templateId,
      );
    }

    // Generate UUID for invitation
    const invitationId = uuidv4();

    // Create aggregate using factory method
    const invitation = Invitation.create(
      invitationId,
      command.templateId,
      command.candidateId,
      command.companyName,
      command.invitedBy,
      command.expiresAt,
      template.getQuestionsCount(),
      command.allowPause,
      command.showTimer,
    );

    // Atomic write: save aggregate + outbox event in single transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.invitationRepository.save(invitation, tx);
      return this.outboxService.saveEvent(
        'invitation.created',
        {
          invitationId: invitation.id,
          templateId: command.templateId,
          candidateId: command.candidateId,
          companyName: command.companyName,
          invitedBy: command.invitedBy,
          expiresAt: command.expiresAt.toISOString(),
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

    this.logger.info('Invitation created successfully', {
      action: 'CreateInvitation',
      invitationId: invitation.id,
    });
    return invitation.id;
  }
}
