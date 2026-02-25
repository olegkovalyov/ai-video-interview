import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetInvitationQuery } from './get-invitation.query';
import { InvitationResponseDto, InvitationWithTemplateDto } from '../../dto/invitation.response.dto';
import { IInvitationReadRepository } from '../../../domain/repositories/invitation-read.repository.interface';
import { InvitationNotFoundException, InvitationAccessDeniedException } from '../../../domain/exceptions/invitation.exceptions';
import { LoggerService } from '../../../infrastructure/logger/logger.service';

@QueryHandler(GetInvitationQuery)
export class GetInvitationHandler implements IQueryHandler<GetInvitationQuery> {
  constructor(
    @Inject('IInvitationReadRepository')
    private readonly readRepository: IInvitationReadRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    query: GetInvitationQuery,
  ): Promise<InvitationResponseDto | InvitationWithTemplateDto> {
    this.logger.info(`Getting invitation: ${query.invitationId}`);

    if (query.includeTemplate) {
      const invitation = await this.readRepository.findByIdWithTemplate(
        query.invitationId,
      );

      if (!invitation) {
        throw new InvitationNotFoundException(query.invitationId);
      }

      // RBAC check
      this.checkAccess(invitation, query.userId, query.userRole);

      return invitation;
    }

    const invitation = await this.readRepository.findById(query.invitationId);

    if (!invitation) {
      throw new InvitationNotFoundException(query.invitationId);
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
      throw new InvitationAccessDeniedException(
        'You do not have permission to view this invitation',
      );
    }
  }
}
