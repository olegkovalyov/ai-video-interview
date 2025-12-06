import { IQuery } from '@nestjs/cqrs';

export class ListHRInvitationsQuery implements IQuery {
  constructor(
    public readonly hrUserId: string,
    public readonly userId: string, // for RBAC
    public readonly userRole: string,
    public readonly status?: string,
    public readonly templateId?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}
