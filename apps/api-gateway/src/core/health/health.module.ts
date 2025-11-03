import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * Health Module
 * Provides health check endpoints for monitoring
 * 
 * Endpoints:
 * - GET /health          - Overall health
 * - GET /health/ready    - Readiness probe
 * - GET /health/live     - Liveness probe
 * - GET /health/circuits - Circuit breaker status
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
