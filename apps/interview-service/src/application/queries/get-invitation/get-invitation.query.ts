import { IQuery } from '@nestjs/cqrs';

export class GetInvitationQuery implements IQuery {
  constructor(
    public readonly invitationId: string,
    public readonly userId: string,
    public readonly userRole: string,
    public readonly includeTemplate: boolean = false,
  ) {}
}
