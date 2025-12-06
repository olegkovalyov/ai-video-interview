import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetInvitationQuery } from './get-invitation.query';
import { InvitationResponseDto, InvitationWithTemplateDto } from '../../dto/invitation.response.dto';
import { InvitationReadRepository } from '../../../infrastructure/persistence/repositories/invitation-read.repository';

@QueryHandler(GetInvitationQuery)
export class GetInvitationHandler implements IQueryHandler<GetInvitationQuery> {
  private readonly logger = new Logger(GetInvitationHandler.name);

  constructor(
    private readonly readRepository: InvitationReadRepository,
  ) {}

  async execute(
    query: GetInvitationQuery,
  ): Promise<InvitationResponseDto | InvitationWithTemplateDto> {
    this.logger.log(`Getting invitation: ${query.invitationId}`);

    if (query.includeTemplate) {
      const invitation = await this.readRepository.findByIdWithTemplate(
        query.invitationId,
      );

      if (!invitation) {
        throw new NotFoundException(
          `Invitation with ID ${query.invitationId} not found`,
        );
      }

      // RBAC check
      this.checkAccess(invitation, query.userId, query.userRole);

      return invitation;
    }

    const invitation = await this.readRepository.findById(query.invitationId);

    if (!invitation) {
      throw new NotFoundException(
        `Invitation with ID ${query.invitationId} not found`,
      );
    }

    // RBAC check
    this.checkAccess(invitation, query.userId, query.userRole);

    return invitation;
  }

  private checkAccess(
    invitation: InvitationResponseDto,
    userId: string,
    userRole: string,
  ): void {
    const isAdmin = userRole === 'admin';
    const isCandidate = invitation.candidateId === userId;
    const isInviter = invitation.invitedBy === userId;

    if (!isAdmin && !isCandidate && !isInviter) {
      throw new ForbiddenException(
        'You do not have permission to view this invitation',
      );
    }
  }
}
