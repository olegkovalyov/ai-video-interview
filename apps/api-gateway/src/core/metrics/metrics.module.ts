import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';

/**
 * Metrics Module
 * Provides MetricsService globally to avoid duplicate metric registration
 */
@Global()
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
