import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InterviewServiceClient } from './clients/interview-service.client';
import { TemplatesController } from './controllers/templates.controller';
import { InvitationsController } from './controllers/invitations.controller';
import { LoggerService } from '../../core/logging/logger.service';

/**
 * Interview Service Module
 * Aggregates all interview-service related functionality
 * 
 * Structure:
 * - InterviewServiceClient: Typed HTTP client for templates & invitations API
 * - TemplatesController: REST API endpoints for templates management
 * - InvitationsController: REST API endpoints for invitations management
 * 
 * This module encapsulates all API Gateway interactions with Interview Service.
 * 
 * Note: JwtAuthGuard is available globally from AuthModule (@Global)
 */
@Module({
  imports: [
    HttpModule,
  ],
  controllers: [
    TemplatesController,
    InvitationsController,
  ],
  providers: [
    InterviewServiceClient,
    LoggerService,
  ],
  exports: [
    InterviewServiceClient,
  ],
})
export class InterviewServiceModule {}
