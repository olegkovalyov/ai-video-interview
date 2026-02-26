import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InterviewServiceClient } from './clients/interview-service.client';
import { TemplatesController } from './controllers/templates.controller';
import { InvitationsController } from './controllers/invitations.controller';
import { UserServiceModule } from '../user-service/user-service.module';

/**
 * Interview Service Module
 * Aggregates all interview-service related functionality
 *
 * Structure:
 * - InterviewServiceClient: Typed HTTP client (extends BaseServiceProxy — circuit breaker, retry, metrics)
 * - TemplatesController: REST API endpoints for templates management
 * - InvitationsController: REST API endpoints for invitations management
 *
 * Dependencies (via @Global modules): LoggerService, MetricsService, CircuitBreakerRegistry
 */
@Module({
  imports: [
    HttpModule,
    UserServiceModule,
  ],
  controllers: [
    TemplatesController,
    InvitationsController,
  ],
  providers: [
    InterviewServiceClient,
  ],
  exports: [
    InterviewServiceClient,
  ],
})
export class InterviewServiceModule {}
