import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BillingServiceClient } from './clients/billing-service.client';
import { BillingProxyController } from './controllers/billing-proxy.controller';
import { WebhookProxyController } from './controllers/webhook-proxy.controller';

/**
 * Billing Service Module
 * Provides access to Billing Service for subscription management, checkout, and webhooks.
 * BillingServiceClient extends BaseServiceProxy — circuit breaker (10s timeout), retry, metrics.
 *
 * Dependencies (via @Global modules): LoggerService, MetricsService, CircuitBreakerRegistry
 */
@Module({
  imports: [HttpModule],
  controllers: [BillingProxyController, WebhookProxyController],
  providers: [BillingServiceClient],
  exports: [BillingServiceClient],
})
export class BillingServiceModule {}
