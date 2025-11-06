import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InterviewServiceProxy } from './clients/interview-service.proxy';
import { InterviewServiceClient } from './clients/interview-service.client';
import { TemplatesController } from './controllers/templates.controller';
import { LoggerService } from '../../core/logging/logger.service';

/**
 * Interview Service Module
 * Aggregates all interview-service related functionality
 * 
 * Structure:
 * - InterviewServiceProxy: HTTP client for interview-service communication (legacy)
 * - InterviewServiceClient: Typed HTTP client for templates API
 * - TemplatesController: REST API endpoints for templates management
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
  ],
  providers: [
    InterviewServiceProxy,
    InterviewServiceClient,
    LoggerService,
  ],
  exports: [
    InterviewServiceProxy,
    InterviewServiceClient,
  ],
})
export class InterviewServiceModule {}
