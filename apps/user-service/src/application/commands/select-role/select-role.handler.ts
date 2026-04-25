import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { SelectRoleCommand } from './select-role.command';
import { RoleSelectionService } from '../../services/role-selection.service';

/**
 * Thin CQRS adapter over {@link RoleSelectionService}.
 */
@Injectable()
@CommandHandler(SelectRoleCommand)
export class SelectRoleHandler implements ICommandHandler<SelectRoleCommand> {
  constructor(private readonly roleSelection: RoleSelectionService) {}

  execute(command: SelectRoleCommand): Promise<void> {
    return this.roleSelection.select({
      userId: command.userId,
      role: command.role,
    });
  }
}
