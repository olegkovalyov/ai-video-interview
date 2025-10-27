import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { KafkaService, KAFKA_TOPICS, UserAuthenticatedEvent, UserRegisteredEvent, UserLoggedOutEvent, UserProfileUpdatedEvent } from '@repo/shared';
import { EventIdempotencyService } from './event-idempotency.service';

@Injectable()
export class UserEventConsumerService implements OnModuleInit {
  private readonly serviceName = 'interview-service';

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
    private readonly idempotencyService: EventIdempotencyService,
  ) {}

  async onModuleInit() {
    // Subscribe to user events
    await this.kafkaService.subscribe(
      KAFKA_TOPICS.USER_EVENTS, 
      'interview-service-group', 
      async (message) => {
        await this.handleUserEvent(message);
      },
      {
        fromBeginning: false,
        autoCommit: true,
        mode: 'eachMessage'
      }
    );

    console.log('🎯 Interview Service subscribed to User Events (eachMessage mode)');
  }

  private async handleUserEvent(event: any) {
    try {
      const parsedEvent = JSON.parse(event.value);
      const eventId = parsedEvent.eventId;
      const eventType = parsedEvent.eventType;
      
      // Process with idempotency check
      await this.idempotencyService.processEventSafely(
        eventId,
        eventType,
        this.serviceName,
        parsedEvent,
        async (payload) => {
          switch (payload.eventType) {
            case 'user.authenticated':
              await this.handleUserAuthenticated(payload as UserAuthenticatedEvent);
              break;
              
            case 'user.registered':
              await this.handleUserRegistered(payload as UserRegisteredEvent);
              break;
              
            case 'user.logged_out':
              await this.handleUserLoggedOut(payload as UserLoggedOutEvent);
              break;
              
            case 'user.profile_updated':
              await this.handleUserProfileUpdated(payload as UserProfileUpdatedEvent);
              break;
            
            default:
              console.log(`🔄 Unknown user event type: ${payload.eventType}`);
          }
        }
      );
    } catch (error) {
      console.error('❌ Error processing user event:', error);
      throw error; // Re-throw to prevent offset commit
    }
  }

  private async handleUserAuthenticated(event: UserAuthenticatedEvent) {
    console.log(`🎤 User authenticated in interview context: ${event.payload.userId}`);
    
    // TODO: Update active interview sessions
    // TODO: Resume paused interviews if any
    // TODO: Log interview activity
    
    // Example: Resume user's active interviews
    // await this.interviewRepository.resumeActiveInterviews(event.payload.userId);
  }

  private async handleUserRegistered(event: UserRegisteredEvent) {
    console.log(`🆕 New user for interviews: ${event.payload.userId} (${event.payload.email})`);
    
    // TODO: Create interview profile
    // TODO: Initialize interview preferences  
    // TODO: Set up default interview templates
    // TODO: Send onboarding interview invitation
    
    // Example: Setup interview preferences
    // await this.interviewService.initializeUserPreferences(event.payload);
  }

  private async handleUserLoggedOut(event: UserLoggedOutEvent) {
    console.log(`👋 User logged out - interview cleanup: ${event.payload.userId}`);
    
    // TODO: Pause active interviews
    // TODO: Save interview state
    // TODO: Clean up temporary interview data
    // TODO: Notify interviewers if in session
    
    // Example: Pause ongoing interviews
    // await this.interviewRepository.pauseActiveInterviews(event.payload.userId);
  }

  private async handleUserProfileUpdated(event: UserProfileUpdatedEvent) {
    console.log(`📝 User profile updated - interview sync: ${event.payload.userId}`);
    
    // TODO: Update interview candidate profiles
    // TODO: Sync interviewer information
    // TODO: Update interview notifications preferences
    // TODO: Refresh interview scheduling availability
    
    // Example: Sync profile to interview system
    // await this.candidateService.syncProfile(event.payload);
  }
}
