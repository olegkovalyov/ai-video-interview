import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommandBus } from '@nestjs/cqrs';
import { InboxEntity } from '../../persistence/entities/inbox.entity';
import { CreateUserCommand } from '../../../application/commands/create-user/create-user.command';
import { UpdateUserCommand } from '../../../application/commands/update-user/update-user.command';
import { DeleteUserCommand } from '../../../application/commands/delete-user/delete-user.command';
import { SuspendUserCommand } from '../../../application/commands/suspend-user/suspend-user.command';
import { ActivateUserCommand } from '../../../application/commands/activate-user/activate-user.command';
import { AssignRoleCommand } from '../../../application/commands/assign-role/assign-role.command';
import { RemoveRoleCommand } from '../../../application/commands/remove-role/remove-role.command';
import {
  UserCommand,
  UserCreateCommand,
  UserUpdateCommand,
  UserDeleteCommand,
  UserSuspendCommand,
  UserActivateCommand,
  UserAssignRoleCommand,
  UserRemoveRoleCommand,
} from '@repo/shared';

/**
 * INBOX Worker Processor
 * 
 * Processes commands from user-commands topic:
 * 1. Fetches command from inbox table
 * 2. Executes CQRS command
 * 3. Command handler publishes integration event to OUTBOX
 * 4. Updates inbox status
 * 
 * Command → Event mapping:
 * - user.create → CreateUserCommand → user.created event
 * - user.update → UpdateUserCommand → user.updated event
 * - user.delete → DeleteUserCommand → user.deleted event
 * - user.suspend → SuspendUserCommand → user.suspended event
 * - user.activate → ActivateUserCommand → user.activated event
 * - user.assign_role → AssignRoleCommand → user.role_assigned event
 * - user.remove_role → RemoveRoleCommand → user.role_removed event
 * 
 * Runs with concurrency for parallel processing
 */
@Processor('inbox-processor')
@Injectable()
export class InboxWorkerProcessor {
  constructor(
    @InjectRepository(InboxEntity)
    private readonly inboxRepository: Repository<InboxEntity>,
    private readonly commandBus: CommandBus,
  ) {}

  @Process({
    name: 'process-inbox-message',
    concurrency: 4, // Process 4 messages in parallel
  })
  async processInboxMessage(job: Job) {
    const { messageId } = job.data;

    console.log(`🔄 INBOX WORKER: Processing ${messageId}`);

    // 1. Fetch from inbox table
    const inbox = await this.inboxRepository.findOne({
      where: { messageId, status: 'pending' },
    });

    if (!inbox) {
      console.log(`⏭️  INBOX WORKER: Message ${messageId} already processed or not found`);
      return;
    }

    // 2. Mark as processing
    inbox.status = 'processing';
    await this.inboxRepository.save(inbox);

    try {
      // 3. Process business logic
      await this.processEvent(inbox.payload);

      // 4. Mark as processed
      inbox.status = 'processed';
      inbox.processedAt = new Date();
      await this.inboxRepository.save(inbox);

      console.log(`✅ INBOX WORKER: Successfully processed ${messageId}`);
    } catch (error) {
      // 5. Handle failure
      inbox.status = 'failed';
      inbox.errorMessage = error.message;
      inbox.retryCount += 1;
      await this.inboxRepository.save(inbox);

      console.error(`❌ INBOX WORKER: Failed to process ${messageId}:`, error);

      // Re-throw if haven't exceeded retry limit
      if (inbox.retryCount < 3) {
        throw error; // BullMQ will retry
      }

      console.log(`💀 INBOX WORKER: Max retries reached for ${messageId}`);
    }
  }

  private async processEvent(command: any) {
    console.log(`📋 INBOX WORKER: Processing command: ${command.eventType} from ${command.source}`);

    // Process commands (we only receive from user-commands topic)
    switch (command.eventType as string) {
      case 'user.create':
        await this.handleUserCreate(command as UserCreateCommand);
        break;

      case 'user.update':
        await this.handleUserUpdate(command as UserUpdateCommand);
        break;

      case 'user.delete':
        await this.handleUserDelete(command as UserDeleteCommand);
        break;

      case 'user.suspend':
        await this.handleUserSuspend(command as UserSuspendCommand);
        break;

      case 'user.activate':
        await this.handleUserActivate(command as UserActivateCommand);
        break;

      case 'user.assign_role':
        await this.handleUserAssignRole(command as UserAssignRoleCommand);
        break;

      case 'user.remove_role':
        await this.handleUserRemoveRole(command as UserRemoveRoleCommand);
        break;

      default:
        console.log(`⚠️  INBOX WORKER: Unknown command type: ${command.eventType}`);
    }
  }

  private async handleUserCreate(cmd: UserCreateCommand) {
    console.log(`🆕 INBOX WORKER: user.create - ${cmd.payload.userId} (${cmd.payload.email})`);

    const command = new CreateUserCommand(
      cmd.payload.userId,          // Internal userId (primary key)
      cmd.payload.externalAuthId,  // External auth provider ID
      cmd.payload.email,
      cmd.payload.firstName || '',
      cmd.payload.lastName || '',
    );

    await this.commandBus.execute(command);
  }

  private async handleUserUpdate(cmd: UserUpdateCommand) {
    console.log(`📝 INBOX WORKER: user.update - ${cmd.payload.userId}`);

    const command = new UpdateUserCommand(
      cmd.payload.userId,
      cmd.payload.firstName,
      cmd.payload.lastName,
      undefined, // bio
      undefined, // phone
      undefined, // timezone
      undefined, // language
    );

    await this.commandBus.execute(command);
  }

  private async handleUserDelete(cmd: UserDeleteCommand) {
    console.log(`🗑️  INBOX WORKER: user.delete - ${cmd.payload.userId}`);

    const command = new DeleteUserCommand(
      cmd.payload.userId,
      cmd.payload.deletedBy,
    );
    
    await this.commandBus.execute(command);
  }

  private async handleUserSuspend(cmd: UserSuspendCommand) {
    console.log(`⏸️  INBOX WORKER: user.suspend - ${cmd.payload.userId}`);

    const command = new SuspendUserCommand(
      cmd.payload.userId,
      cmd.payload.reason || 'Admin action',
      'admin',
    );
    await this.commandBus.execute(command);
  }

  private async handleUserActivate(cmd: UserActivateCommand) {
    console.log(`▶️  INBOX WORKER: user.activate - ${cmd.payload.userId}`);

    const command = new ActivateUserCommand(cmd.payload.userId);
    await this.commandBus.execute(command);
  }

  private async handleUserAssignRole(cmd: UserAssignRoleCommand) {
    console.log(`🎭 INBOX WORKER: user.assign_role - ${cmd.payload.roleName} to ${cmd.payload.userId}`);

    const command = new AssignRoleCommand(
      cmd.payload.userId,
      cmd.payload.roleName,
      cmd.payload.assignedBy,
    );

    await this.commandBus.execute(command);
  }

  private async handleUserRemoveRole(cmd: UserRemoveRoleCommand) {
    console.log(`🎭 INBOX WORKER: user.remove_role - ${cmd.payload.roleName} from ${cmd.payload.userId}`);

    const command = new RemoveRoleCommand(
      cmd.payload.userId,
      cmd.payload.roleName,
      cmd.payload.removedBy,
    );

    await this.commandBus.execute(command);
  }
}
