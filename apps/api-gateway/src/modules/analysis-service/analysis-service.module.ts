import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalysisServiceClient } from './clients/analysis-service.client';
import { AnalysisController } from './controllers/analysis.controller';
import { LoggerService } from '../../core/logging/logger.service';

/**
 * Analysis Service Module
 * Provides access to AI Analysis Service for interview analysis results
 * 
 * Endpoints:
 * - GET /analysis/:invitationId - Get analysis results
 * - GET /analysis/:invitationId/status - Get analysis status
 * - GET /analysis/:invitationId/questions - Get detailed question analyses
 */
@Module({
  imports: [HttpModule],
  controllers: [AnalysisController],
  providers: [
    AnalysisServiceClient,
    LoggerService,
  ],
  exports: [AnalysisServiceClient],
})
export class AnalysisServiceModule {}
