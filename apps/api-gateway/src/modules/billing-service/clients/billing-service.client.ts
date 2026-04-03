import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseServiceProxy } from '../../../proxies/base/base-service-proxy';
import { LoggerService } from '../../../core/logging/logger.service';
import { MetricsService } from '../../../core/metrics/metrics.service';
import { CircuitBreakerRegistry } from '../../../core/circuit-breaker/circuit-breaker-registry.service';

/**
 * Billing Service Client
 * HTTP client for communication with Billing Service.
 * Extends BaseServiceProxy for circuit breaker, retry, metrics, and error handling.
 */
@Injectable()
export class BillingServiceClient extends BaseServiceProxy {
  protected readonly serviceName = 'billing-service';
  protected readonly baseUrl: string;
  private readonly internalToken: string;

  protected circuitBreakerOptions = {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 10000,
    resetTimeout: 60000,
  };

  constructor(
    httpService: HttpService,
    loggerService: LoggerService,
    metricsService: MetricsService,
    circuitBreakerRegistry: CircuitBreakerRegistry,
    private readonly configService: ConfigService,
  ) {
    super(httpService, loggerService, metricsService, circuitBreakerRegistry);

    this.baseUrl =
      this.configService.get<string>('BILLING_SERVICE_URL') ||
      'http://localhost:8007';
    this.internalToken =
      this.configService.get<string>('INTERNAL_SERVICE_TOKEN') || '';

    this.initCircuitBreaker();
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      ...super.getDefaultHeaders(),
      'x-internal-token': this.internalToken,
    };
  }

  /**
   * GET /api/billing/subscription
   * Get current subscription for a company.
   */
  async getSubscription(
    companyId: string,
    userId: string,
    role: string,
  ): Promise<any> {
    return this.get('/api/billing/subscription', {
      headers: {
        'x-user-id': userId,
        'x-user-role': role,
        'x-company-id': companyId,
      },
    });
  }

  /**
   * POST /api/billing/checkout
   * Create a Stripe checkout session.
   */
  async createCheckoutSession(
    data: any,
    userId: string,
    companyId: string,
    role: string,
  ): Promise<any> {
    return this.post('/api/billing/checkout', data, {
      headers: {
        'x-user-id': userId,
        'x-user-role': role,
        'x-company-id': companyId,
      },
    });
  }

  /**
   * POST /api/billing/portal
   * Create a Stripe customer portal session.
   */
  async createPortalSession(
    companyId: string,
    userId: string,
    role: string,
  ): Promise<any> {
    return this.post(
      '/api/billing/portal',
      {},
      {
        headers: {
          'x-user-id': userId,
          'x-user-role': role,
          'x-company-id': companyId,
        },
      },
    );
  }

  /**
   * POST /api/billing/cancel
   * Cancel the company's subscription.
   */
  async cancelSubscription(
    companyId: string,
    userId: string,
    role: string,
  ): Promise<any> {
    return this.post(
      '/api/billing/cancel',
      {},
      {
        headers: {
          'x-user-id': userId,
          'x-user-role': role,
          'x-company-id': companyId,
        },
      },
    );
  }

  /**
   * POST /api/billing/resume
   * Resume a cancelled subscription.
   */
  async resumeSubscription(
    companyId: string,
    userId: string,
    role: string,
  ): Promise<any> {
    return this.post(
      '/api/billing/resume',
      {},
      {
        headers: {
          'x-user-id': userId,
          'x-user-role': role,
          'x-company-id': companyId,
        },
      },
    );
  }

  /**
   * GET /api/billing/usage
   * Get usage statistics for a company.
   */
  async getUsage(
    companyId: string,
    userId: string,
    role: string,
  ): Promise<any> {
    return this.get('/api/billing/usage', {
      headers: {
        'x-user-id': userId,
        'x-user-role': role,
        'x-company-id': companyId,
      },
    });
  }

  /**
   * GET /api/billing/plans
   * Get available billing plans (public).
   */
  async getPlans(): Promise<any> {
    return this.get('/api/billing/plans');
  }

  /**
   * GET /api/billing/invoices
   * Get invoices for a company.
   */
  async getInvoices(
    companyId: string,
    userId: string,
    role: string,
  ): Promise<any> {
    return this.get('/api/billing/invoices', {
      headers: {
        'x-user-id': userId,
        'x-user-role': role,
        'x-company-id': companyId,
      },
    });
  }

  /**
   * GET /internal/quota/:companyId/:resource
   * Check quota availability for a company (internal use).
   */
  async checkQuota(companyId: string, resource: string): Promise<any> {
    return this.get(`/internal/quota/${companyId}/${resource}`, {
      bypassCircuitBreaker: false,
    });
  }
}
