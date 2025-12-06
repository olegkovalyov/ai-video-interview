import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateInvitationCommand } from './create-invitation.command';
import { Invitation } from '../../../domain/aggregates/invitation.aggregate';
import type { IInvitationRepository } from '../../../domain/repositories/invitation.repository.interface';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';

@CommandHandler(CreateInvitationCommand)
export class CreateInvitationHandler
  implements ICommandHandler<CreateInvitationCommand>
{
  private readonly logger = new Logger(CreateInvitationHandler.name);

  constructor(
    @Inject('IInvitationRepository')
    private readonly invitationRepository: IInvitationRepository,
    @Inject('IInterviewTemplateRepository')
    private readonly templateRepository: IInterviewTemplateRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateInvitationCommand): Promise<string> {
    this.logger.log(
      `Creating invitation for candidate ${command.candidateId} to template ${command.templateId}`,
    );

    // Verify template exists and is active
    const template = await this.templateRepository.findById(command.templateId);
    if (!template) {
      throw new NotFoundException(
        `Template with id ${command.templateId} not found`,
      );
    }

    if (!template.status.isActive()) {
      throw new BadRequestException(
        'Cannot create invitation for non-active template',
      );
    }

    // Check for duplicate invitation
    const exists = await this.invitationRepository.existsByCandidateAndTemplate(
      command.candidateId,
      command.templateId,
    );
    if (exists) {
      throw new BadRequestException(
        'Invitation for this candidate and template already exists',
      );
    }

    // Generate UUID for invitation
    const invitationId = uuidv4();

    // Create aggregate using factory method
    const invitation = Invitation.create(
      invitationId,
      command.templateId,
      command.candidateId,
      command.companyId,
      command.invitedBy,
      command.expiresAt,
      template.getQuestionsCount(),
      command.allowPause,
      command.showTimer,
    );

    // Save to repository
    await this.invitationRepository.save(invitation);

    // Publish domain events
    const events = invitation.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    invitation.commit();

    this.logger.log(`Invitation created successfully: ${invitation.id}`);
    return invitation.id;
  }
}
