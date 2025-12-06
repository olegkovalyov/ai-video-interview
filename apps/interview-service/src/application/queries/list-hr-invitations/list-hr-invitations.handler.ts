import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger, ForbiddenException } from '@nestjs/common';
import { ListHRInvitationsQuery } from './list-hr-invitations.query';
import { PaginatedInvitationsResponseDto } from '../../dto/invitation.response.dto';
import { InvitationReadRepository } from '../../../infrastructure/persistence/repositories/invitation-read.repository';

@QueryHandler(ListHRInvitationsQuery)
export class ListHRInvitationsHandler
  implements IQueryHandler<ListHRInvitationsQuery>
{
  private readonly logger = new Logger(ListHRInvitationsHandler.name);

  constructor(
    private readonly readRepository: InvitationReadRepository,
  ) {}

  async execute(
    query: ListHRInvitationsQuery,
  ): Promise<PaginatedInvitationsResponseDto> {
    this.logger.log(`Listing invitations created by HR: ${query.hrUserId}`);

    // RBAC: HR can only see invitations they created
    // Admin can see any HR's invitations
    if (query.userRole !== 'admin' && query.hrUserId !== query.userId) {
      throw new ForbiddenException(
        'You can only view invitations you created',
      );
    }

    const skip = (query.page - 1) * query.limit;

    return this.readRepository.findByInvitedBy(
      query.hrUserId,
      { status: query.status, templateId: query.templateId },
      skip,
      query.limit,
    );
  }
}
