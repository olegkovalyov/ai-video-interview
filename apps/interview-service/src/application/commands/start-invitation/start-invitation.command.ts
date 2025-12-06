import { ICommand } from '@nestjs/cqrs';

export class StartInvitationCommand implements ICommand {
  constructor(
    public readonly invitationId: string,
    public readonly userId: string,
  ) {}
}
