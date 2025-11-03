import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InterviewServiceProxy } from './clients/interview-service.proxy';

/**
 * Interview Service Module
 * Aggregates all interview-service related functionality
 * 
 * Structure:
 * - InterviewServiceProxy: HTTP client for interview-service communication
 * 
 * This module encapsulates all API Gateway interactions with Interview Service.
 */
@Module({
  imports: [
    HttpModule,
  ],
  providers: [
    InterviewServiceProxy,
  ],
  exports: [
    InterviewServiceProxy,
  ],
})
export class InterviewServiceModule {}
