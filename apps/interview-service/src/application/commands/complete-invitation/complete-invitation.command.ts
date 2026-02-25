import { ICommand } from '@nestjs/cqrs';
import { CompletedReason } from '../../../domain/events/invitation-completed.event';

export class CompleteInvitationCommand implements ICommand {
  constructor(
    public readonly invitationId: string,
    public readonly userId: string | null, // null for system auto-complete
    public readonly reason: CompletedReason = 'manual',
  ) {}
}
