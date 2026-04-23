import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import type {
  IBillingClient,
  QuotaCheckResult,
  QuotaResource,
} from '../../application/interfaces/billing-client.interface';

const DEFAULT_TIMEOUT_MS = 2000;

@Injectable()
export class HttpBillingClient implements IBillingClient {
  private readonly baseUrl: string;
  private readonly internalToken: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'BILLING_SERVICE_URL',
      'http://localhost:8007',
    );
    this.internalToken = this.configService.get<string>(
      'INTERNAL_SERVICE_TOKEN',
      'internal-secret',
    );
    this.timeoutMs = Number(
      this.configService.get<number>(
        'BILLING_CLIENT_TIMEOUT_MS',
        DEFAULT_TIMEOUT_MS,
      ),
    );
  }

  async checkQuota(
    companyId: string,
    resource: QuotaResource,
  ): Promise<QuotaCheckResult> {
    const url = `${this.baseUrl}/api/billing/internal/quota/${encodeURIComponent(companyId)}/${encodeURIComponent(resource)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-internal-token': this.internalToken,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn('Billing quota check returned non-OK status', {
          action: 'CheckQuota',
          companyId,
          resource,
          status: response.status,
        });
        // Fail-open: if billing-service is degraded we do not want to block
        // legitimate HR workflows. Logged + metricked so ops can react.
        return this.failOpen(resource);
      }

      const data = (await response.json()) as QuotaCheckResult;
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn('Billing quota check failed; failing open', {
        action: 'CheckQuota',
        companyId,
        resource,
        error: message,
      });
      return this.failOpen(resource);
    } finally {
      clearTimeout(timer);
    }
  }

  private failOpen(_resource: QuotaResource): QuotaCheckResult {
    return {
      allowed: true,
      remaining: -1,
      limit: -1,
      currentPlan: 'unknown',
    };
  }
}
