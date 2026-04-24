import { Command } from '@nestjs/cqrs';

export class SelectRoleCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly role: 'candidate' | 'hr' | 'admin',
  ) {
    super();
  }
}
