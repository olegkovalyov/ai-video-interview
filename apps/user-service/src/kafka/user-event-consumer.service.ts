import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { KafkaService, KAFKA_TOPICS, UserAuthenticatedEvent, UserRegisteredEvent, UserLoggedOutEvent, UserProfileUpdatedEvent } from '@repo/shared';
import { EventIdempotencyService } from './event-idempotency.service';

@Injectable()
export class UserEventConsumerService implements OnModuleInit {
  private readonly serviceName = 'user-service';

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
    private readonly idempotencyService: EventIdempotencyService,
  ) {}

  async onModuleInit() {
    // Subscribe to user events
    await this.kafkaService.subscribe(
      KAFKA_TOPICS.USER_EVENTS, 
      'user-service-group', 
      async (message) => {
        await this.handleUserEvent(message);
      },
      {
        fromBeginning: false,
        autoCommit: false,
        mode: 'eachBatch'
      }
    );

    console.log('🎯 User Service subscribed to User Events (manual commit mode)');
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
    console.log(`👤 User authenticated: ${event.payload.userId} via ${event.payload.authMethod}`);
    
    // TODO: Update user last login timestamp
    // TODO: Log authentication activity 
    // TODO: Update user session tracking
    
    // Example: Update user's last login timestamp in database
    // await this.userRepository.updateLastLogin(event.payload.userId);
  }

  private async handleUserRegistered(event: UserRegisteredEvent) {
    console.log(`🆕 New user registered: ${event.payload.userId} (${event.payload.email})`);
    
    // TODO: Send welcome email
    // TODO: Create user profile
    // TODO: Initialize user preferences
    // TODO: Setup default user roles
    
    // Example: Create user profile
    // await this.userRepository.createProfile(event.payload);
  }

  private async handleUserLoggedOut(event: UserLoggedOutEvent) {
    console.log(`👋 User logged out: ${event.payload.userId}`);
    
    // TODO: Invalidate active sessions
    // TODO: Log logout activity
    // TODO: Clear temporary user data
    
    // Example: Clean up user sessions
    // await this.sessionRepository.invalidateUserSessions(event.payload.userId);
  }

  private async handleUserProfileUpdated(event: UserProfileUpdatedEvent) {
    console.log(`📝 User profile updated: ${event.payload.userId}`);
    
    // TODO: Validate profile changes
    // TODO: Update search indexes
    // TODO: Notify other services if needed
    // TODO: Log profile changes
    
    // Example: Update search indexes
    // await this.searchService.updateUserIndex(event.payload);
  }
}
