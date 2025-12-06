import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CompleteInvitationCommand } from './complete-invitation.command';
import type { IInvitationRepository } from '../../../domain/repositories/invitation.repository.interface';

@CommandHandler(CompleteInvitationCommand)
export class CompleteInvitationHandler
  implements ICommandHandler<CompleteInvitationCommand>
{
  private readonly logger = new Logger(CompleteInvitationHandler.name);

  constructor(
    @Inject('IInvitationRepository')
    private readonly invitationRepository: IInvitationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CompleteInvitationCommand): Promise<void> {
    this.logger.log(
      `Completing invitation ${command.invitationId} with reason: ${command.reason}`,
    );

    // Find invitation
    const invitation = await this.invitationRepository.findById(
      command.invitationId,
    );
    if (!invitation) {
      throw new NotFoundException(
        `Invitation with id ${command.invitationId} not found`,
      );
    }

    // Complete the invitation (domain method handles validation)
    try {
      invitation.complete(command.userId, command.reason);
    } catch (error: any) {
      if (error.message.includes('Only the invited candidate')) {
        throw new ForbiddenException(error.message);
      }
      throw new BadRequestException(error.message);
    }

    // Save to repository
    await this.invitationRepository.save(invitation);

    // Publish domain events
    const events = invitation.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    invitation.commit();

    this.logger.log(
      `Invitation ${invitation.id} completed successfully with reason: ${command.reason}`,
    );
  }
}
