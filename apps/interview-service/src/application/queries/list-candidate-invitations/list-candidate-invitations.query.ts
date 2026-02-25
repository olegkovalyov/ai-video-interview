import { IQuery } from '@nestjs/cqrs';

export class ListCandidateInvitationsQuery implements IQuery {
  constructor(
    public readonly candidateId: string,
    public readonly userId: string, // for RBAC
    public readonly userRole: string,
    public readonly status?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}
