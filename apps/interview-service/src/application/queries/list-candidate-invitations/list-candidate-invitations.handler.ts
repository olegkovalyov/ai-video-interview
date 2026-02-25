import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListCandidateInvitationsQuery } from './list-candidate-invitations.query';
import { PaginatedInvitationsResponseDto } from '../../dto/invitation.response.dto';
import { IInvitationReadRepository } from '../../../domain/repositories/invitation-read.repository.interface';
import { InvitationAccessDeniedException } from '../../../domain/exceptions/invitation.exceptions';
import { LoggerService } from '../../../infrastructure/logger/logger.service';

@QueryHandler(ListCandidateInvitationsQuery)
export class ListCandidateInvitationsHandler
  implements IQueryHandler<ListCandidateInvitationsQuery>
{
  constructor(
    @Inject('IInvitationReadRepository')
    private readonly readRepository: IInvitationReadRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    query: ListCandidateInvitationsQuery,
  ): Promise<PaginatedInvitationsResponseDto> {
    this.logger.info(`Listing invitations for candidate: ${query.candidateId}`);

    // RBAC: candidate can only see their own invitations
    // Admin can see any candidate's invitations
    if (query.userRole !== 'admin' && query.candidateId !== query.userId) {
      throw new InvitationAccessDeniedException(
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
