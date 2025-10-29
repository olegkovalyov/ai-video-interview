import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { KafkaService, KAFKA_TOPICS } from '@repo/shared';
import { InboxEntity } from '../../persistence/entities/inbox.entity';

/**
 * INBOX Consumer Service
 * 
 * Listens to Kafka events (eachMessage mode):
 * 1. Saves message to inbox table
 * 2. Adds job to BullMQ queue for processing
 * 3. Kafka auto-commits offset after successful processing
 * 
 * Uses idempotency (unique message_id) to prevent duplicates
 */
@Injectable()
export class InboxConsumerService implements OnModuleInit {
  private readonly logger = new Logger(InboxConsumerService.name);
  private readonly serviceName = 'user-service';

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
    @InjectRepository(InboxEntity)
    private readonly inboxRepository: Repository<InboxEntity>,
    @InjectQueue('inbox-processor') private readonly inboxQueue: Queue,
  ) {
    this.logger.log('INBOX CONSUMER: Constructor initialized');
  }

  async onModuleInit() {
    this.logger.log('🎯 Starting INBOX Consumer...');
    
    try {
      await this.kafkaService.subscribe(
        KAFKA_TOPICS.USER_EVENTS,
        'user-service-inbox-group',
        async (message) => {
          await this.handleKafkaMessage(message);
        },
        {
          fromBeginning: false,
          autoCommit: true,
          mode: 'eachMessage',
        },
      );

      this.logger.log('✅ INBOX Consumer started successfully (subscribed to user-events)');
    } catch (error) {
      this.logger.error('❌ Failed to start INBOX Consumer', error.stack);
      throw error;
    }
  }

  private async handleKafkaMessage(message: any) {
    const parsedEvent = JSON.parse(message.value.toString());
    const messageId = parsedEvent.eventId;

    try {
      // Check if already exists (idempotency)
      const existing = await this.inboxRepository.findOne({
        where: { messageId },
      });

      if (existing) {
        this.logger.log(`⏭️  INBOX: Message already exists: ${messageId}`);
        return; // Skip, Kafka will auto-commit
      }

      // Save to inbox table
      const inbox = this.inboxRepository.create({
        messageId,
        eventType: parsedEvent.eventType,
        payload: parsedEvent,
        status: 'pending',
        retryCount: 0,
      });

      await this.inboxRepository.save(inbox);
      this.logger.log(`📥 INBOX: Saved message ${messageId} (${parsedEvent.eventType})`);

      // Add to BullMQ queue
      await this.inboxQueue.add(
        'process-inbox-message',
        { messageId },
        {
          jobId: messageId, // Prevent duplicate jobs
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(`📤 INBOX: Queued job for ${messageId}`);
      
      // Success! Kafka will auto-commit offset
    } catch (error) {
      // If unique constraint violation - message already processed
      if (error.code === '23505') {
        this.logger.log(`⏭️  INBOX: Duplicate message ignored: ${messageId}`);
        return; // Skip, Kafka will auto-commit
      }

      this.logger.error(`❌ INBOX: Failed to handle message ${messageId}`, error.stack);
      throw error; // Re-throw to prevent Kafka auto-commit
    }
  }
}
