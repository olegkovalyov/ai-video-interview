import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListHRInvitationsQuery } from './list-hr-invitations.query';
import { PaginatedInvitationsResponseDto } from '../../dto/invitation.response.dto';
import { IInvitationReadRepository } from '../../../domain/repositories/invitation-read.repository.interface';
import { InvitationAccessDeniedException } from '../../../domain/exceptions/invitation.exceptions';
import { LoggerService } from '../../../infrastructure/logger/logger.service';

@QueryHandler(ListHRInvitationsQuery)
export class ListHRInvitationsHandler
  implements IQueryHandler<ListHRInvitationsQuery>
{
  constructor(
    @Inject('IInvitationReadRepository')
    private readonly readRepository: IInvitationReadRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    query: ListHRInvitationsQuery,
  ): Promise<PaginatedInvitationsResponseDto> {
    this.logger.info(`Listing invitations created by HR: ${query.hrUserId}`);

    // RBAC: HR can only see invitations they created
    // Admin can see any HR's invitations
    if (query.userRole !== 'admin' && query.hrUserId !== query.userId) {
      throw new InvitationAccessDeniedException(
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
