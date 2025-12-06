import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { StartInvitationCommand } from './start-invitation.command';
import type { IInvitationRepository } from '../../../domain/repositories/invitation.repository.interface';

@CommandHandler(StartInvitationCommand)
export class StartInvitationHandler
  implements ICommandHandler<StartInvitationCommand>
{
  private readonly logger = new Logger(StartInvitationHandler.name);

  constructor(
    @Inject('IInvitationRepository')
    private readonly invitationRepository: IInvitationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: StartInvitationCommand): Promise<void> {
    this.logger.log(
      `Starting invitation ${command.invitationId} by user ${command.userId}`,
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

    // Start the invitation (domain method handles validation)
    try {
      invitation.start(command.userId);
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

    this.logger.log(`Invitation ${invitation.id} started successfully`);
  }
}
