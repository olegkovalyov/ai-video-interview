import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SubmitResponseCommand } from './submit-response.command';
import { Response } from '../../../domain/entities/response.entity';
import { ResponseType } from '../../../domain/value-objects/response-type.vo';
import type { IInvitationRepository } from '../../../domain/repositories/invitation.repository.interface';

@CommandHandler(SubmitResponseCommand)
export class SubmitResponseHandler
  implements ICommandHandler<SubmitResponseCommand>
{
  private readonly logger = new Logger(SubmitResponseHandler.name);

  constructor(
    @Inject('IInvitationRepository')
    private readonly invitationRepository: IInvitationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SubmitResponseCommand): Promise<string> {
    this.logger.log(
      `Submitting response for invitation ${command.invitationId}, question ${command.questionId}`,
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
    try {
      invitation.submitResponse(command.userId, response);
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

    this.logger.log(`Response ${responseId} submitted successfully`);
    return responseId;
  }
}
