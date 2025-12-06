import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger, ForbiddenException } from '@nestjs/common';
import { ListCandidateInvitationsQuery } from './list-candidate-invitations.query';
import { PaginatedInvitationsResponseDto } from '../../dto/invitation.response.dto';
import { InvitationReadRepository } from '../../../infrastructure/persistence/repositories/invitation-read.repository';

@QueryHandler(ListCandidateInvitationsQuery)
export class ListCandidateInvitationsHandler
  implements IQueryHandler<ListCandidateInvitationsQuery>
{
  private readonly logger = new Logger(ListCandidateInvitationsHandler.name);

  constructor(
    private readonly readRepository: InvitationReadRepository,
  ) {}

  async execute(
    query: ListCandidateInvitationsQuery,
  ): Promise<PaginatedInvitationsResponseDto> {
    this.logger.log(`Listing invitations for candidate: ${query.candidateId}`);

    // RBAC: candidate can only see their own invitations
    // Admin can see any candidate's invitations
    if (query.userRole !== 'admin' && query.candidateId !== query.userId) {
      throw new ForbiddenException(
        'You can only view your own invitations',
      );
    }

    const skip = (query.page - 1) * query.limit;

    return this.readRepository.findByCandidateId(
      query.candidateId,
      { status: query.status },
      skip,
      query.limit,
    );
  }
}
