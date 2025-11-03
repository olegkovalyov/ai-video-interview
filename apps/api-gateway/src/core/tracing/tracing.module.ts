import { Module, Global } from '@nestjs/common';
import { TraceService } from './trace.service';

/**
 * Tracing Module
 * Provides OpenTelemetry distributed tracing
 * 
 * Note: tracing.ts must be imported first in main.ts before bootstrapping
 */
@Global()
@Module({
  providers: [TraceService],
  exports: [TraceService],
})
export class TracingModule {}
