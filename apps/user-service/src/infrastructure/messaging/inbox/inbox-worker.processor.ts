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
import {
  UserRegisteredEvent,
  UserProfileUpdatedEvent,
  UserDeletedEvent,
  UserRoleAssignedEvent,
  UserRoleRemovedEvent,
} from '@repo/shared';

/**
 * INBOX Worker Processor
 * 
 * Processes messages from inbox table:
 * 1. Fetches message from inbox table
 * 2. Executes business logic (Commands)
 * 3. Updates inbox status
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

  private async processEvent(event: any) {
    console.log(`📋 INBOX WORKER: Processing event type: ${event.eventType}`);

    switch (event.eventType) {
      case 'user.registered':
      case 'user.created': // Handle both types (created from outbox, registered from API Gateway)
        await this.handleUserRegistered(event as UserRegisteredEvent);
        break;

      case 'user.profile_updated':
        await this.handleUserProfileUpdated(event as UserProfileUpdatedEvent);
        break;

      case 'user.deleted':
        await this.handleUserDeleted(event as UserDeletedEvent);
        break;

      case 'user.role_assigned':
        await this.handleUserRoleAssigned(event as UserRoleAssignedEvent);
        break;

      case 'user.role_removed':
        await this.handleUserRoleRemoved(event as UserRoleRemovedEvent);
        break;

      default:
        console.log(`⚠️  INBOX WORKER: Unknown event type: ${event.eventType}`);
    }
  }

  private async handleUserRegistered(event: UserRegisteredEvent) {
    console.log(`🆕 INBOX WORKER: User registered: ${event.payload.userId} (${event.payload.email})`);

    const command = new CreateUserCommand(
      event.payload.userId, // keycloakId
      event.payload.email,
      event.payload.firstName || '',
      event.payload.lastName || '',
    );

    await this.commandBus.execute(command);
  }

  private async handleUserProfileUpdated(event: UserProfileUpdatedEvent) {
    console.log(`📝 INBOX WORKER: User profile updated: ${event.payload.userId}`);

    const command = new UpdateUserCommand(
      event.payload.userId,
      event.payload.newValues.firstName as string,
      event.payload.newValues.lastName as string,
      event.payload.newValues.bio as string,
      event.payload.newValues.phone as string,
      event.payload.newValues.timezone as string,
      event.payload.newValues.language as string,
    );

    await this.commandBus.execute(command);
  }

  private async handleUserDeleted(event: UserDeletedEvent) {
    console.log(`🗑️  INBOX WORKER: User deleted: ${event.payload.userId}`);

    const command = new DeleteUserCommand(
      event.payload.userId,
      event.payload.deletedBy || 'system', // deletedBy or default to 'system'
    );
    await this.commandBus.execute(command);
  }

  private async handleUserRoleAssigned(event: UserRoleAssignedEvent) {
    console.log(`🎭 INBOX WORKER: Role assigned: ${event.payload.roleName} to ${event.payload.userId}`);
    // TODO: Implement role assignment command
  }

  private async handleUserRoleRemoved(event: UserRoleRemovedEvent) {
    console.log(`🎭 INBOX WORKER: Role removed: ${event.payload.roleName} from ${event.payload.userId}`);
    // TODO: Implement role removal command
  }
}
