import { Module, Global } from '@nestjs/common';
import { CircuitBreakerRegistry } from './circuit-breaker-registry.service';

/**
 * Circuit Breaker Module
 * Provides circuit breaker pattern for downstream services
 * 
 * Global module - CircuitBreakerRegistry available everywhere
 */
@Global()
@Module({
  providers: [CircuitBreakerRegistry],
  exports: [CircuitBreakerRegistry],
})
export class CircuitBreakerModule {}
