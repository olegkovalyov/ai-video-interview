import { ICommand } from '@nestjs/cqrs';

export class CreateInvitationCommand implements ICommand {
  constructor(
    public readonly templateId: string,
    public readonly candidateId: string,
    public readonly companyName: string,
    public readonly invitedBy: string,
    public readonly expiresAt: Date,
    public readonly allowPause: boolean = true,
    public readonly showTimer: boolean = true,
  ) {}
}
