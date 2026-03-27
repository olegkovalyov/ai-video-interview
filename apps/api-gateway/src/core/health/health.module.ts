import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

/**
 * Health Module
 * Provides health check endpoints with active probes to downstream services
 *
 * Endpoints:
 * - GET /health          - Overall health with service probes
 * - GET /health/ready    - Readiness probe
 * - GET /health/live     - Liveness probe
 * - GET /health/circuits - Circuit breaker status
 */
@Module({
  imports: [HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
