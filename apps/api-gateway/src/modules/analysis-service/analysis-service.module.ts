import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalysisServiceClient } from './clients/analysis-service.client';
import { AnalysisController } from './controllers/analysis.controller';

/**
 * Analysis Service Module
 * Provides access to AI Analysis Service for interview analysis results.
 * AnalysisServiceClient extends BaseServiceProxy — circuit breaker (30s timeout), retry, metrics.
 *
 * Dependencies (via @Global modules): LoggerService, MetricsService, CircuitBreakerRegistry
 */
@Module({
  imports: [HttpModule],
  controllers: [AnalysisController],
  providers: [AnalysisServiceClient],
  exports: [AnalysisServiceClient],
})
export class AnalysisServiceModule {}
