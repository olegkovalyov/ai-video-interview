import { ICommand } from '@nestjs/cqrs';

export class ApproveCandidateCommand implements ICommand {
  constructor(
    public readonly invitationId: string,
    public readonly hrUserId: string,
    public readonly hrRole: string,
    public readonly note?: string,
  ) {}
}
