import { Injectable } from "@nestjs/common";
import {
  register,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from "prom-client";

@Injectable()
export class MetricsService {
  // ─── HTTP ──────────────────────────────────────────────
  public readonly httpRequestsTotal: Counter<string>;
  public readonly httpRequestDuration: Histogram<string>;

  // ─── Subscriptions ─────────────────────────────────────
  private readonly subscriptionActions: Counter<string>;
  private readonly activeSubscriptions: Gauge<string>;

  // ─── Quota ─────────────────────────────────────────────
  private readonly quotaChecks: Counter<string>;
  private readonly quotaCheckDuration: Histogram<string>;

  // ─── Usage ─────────────────────────────────────────────
  private readonly usageIncrements: Counter<string>;

  // ─── Stripe ────────────────────────────────────────────
  private readonly stripeWebhooks: Counter<string>;
  private readonly stripeWebhookDuration: Histogram<string>;

  // ─── Cache ─────────────────────────────────────────────
  private readonly cacheHits: Counter<string>;
  private readonly cacheMisses: Counter<string>;
  private readonly redisAvailable: Gauge<string>;

  constructor() {
    collectDefaultMetrics({
      prefix: "billing_service_",
      register,
    });

    // HTTP
    this.httpRequestsTotal = new Counter({
      name: "billing_service_http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status"],
      registers: [register],
    });

    this.httpRequestDuration = new Histogram({
      name: "billing_service_http_request_duration_seconds",
      help: "HTTP request duration in seconds",
      labelNames: ["method", "route", "status"],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [register],
    });

    // Subscriptions
    this.subscriptionActions = new Counter({
      name: "billing_service_subscription_actions_total",
      help: "Subscription lifecycle actions",
      labelNames: ["action", "plan"],
      registers: [register],
    });

    this.activeSubscriptions = new Gauge({
      name: "billing_service_active_subscriptions",
      help: "Current active subscriptions by plan",
      labelNames: ["plan"],
      registers: [register],
    });

    // Quota
    this.quotaChecks = new Counter({
      name: "billing_service_quota_checks_total",
      help: "Quota check requests",
      labelNames: ["resource", "result", "cache"],
      registers: [register],
    });

    this.quotaCheckDuration = new Histogram({
      name: "billing_service_quota_check_duration_seconds",
      help: "Quota check duration",
      labelNames: ["cache"],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
      registers: [register],
    });

    // Usage
    this.usageIncrements = new Counter({
      name: "billing_service_usage_increments_total",
      help: "Usage increment events",
      labelNames: ["resource"],
      registers: [register],
    });

    // Stripe
    this.stripeWebhooks = new Counter({
      name: "billing_service_stripe_webhooks_total",
      help: "Stripe webhook events processed",
      labelNames: ["event", "status"],
      registers: [register],
    });

    this.stripeWebhookDuration = new Histogram({
      name: "billing_service_stripe_webhook_duration_seconds",
      help: "Stripe webhook processing duration",
      labelNames: ["event"],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2.5, 5, 10],
      registers: [register],
    });

    // Cache
    this.cacheHits = new Counter({
      name: "billing_service_cache_hits_total",
      help: "Cache hits by layer and key type",
      labelNames: ["layer", "key_type"],
      registers: [register],
    });

    this.cacheMisses = new Counter({
      name: "billing_service_cache_misses_total",
      help: "Cache misses by layer and key type",
      labelNames: ["layer", "key_type"],
      registers: [register],
    });

    this.redisAvailable = new Gauge({
      name: "billing_service_redis_available",
      help: "Redis connection status (1=up, 0=down)",
      registers: [register],
    });

    // Default Redis to up
    this.redisAvailable.set(1);
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // ─── HTTP ──────────────────────────────────────────────

  recordHttpRequest(
    method: string,
    route: string,
    status: number,
    duration: number,
  ) {
    this.httpRequestsTotal.inc({ method, route, status: status.toString() });
    this.httpRequestDuration.observe(
      { method, route, status: status.toString() },
      duration,
    );
  }

  // ─── Subscriptions ─────────────────────────────────────

  recordSubscriptionCreated(plan: string) {
    this.subscriptionActions.inc({ action: "created", plan });
    this.activeSubscriptions.inc({ plan });
  }

  recordSubscriptionUpgraded(fromPlan: string, toPlan: string) {
    this.subscriptionActions.inc({ action: "upgraded", plan: toPlan });
    this.activeSubscriptions.dec({ plan: fromPlan });
    this.activeSubscriptions.inc({ plan: toPlan });
  }

  recordSubscriptionCanceled(plan: string) {
    this.subscriptionActions.inc({ action: "canceled", plan });
    this.activeSubscriptions.dec({ plan });
  }

  recordSubscriptionPastDue(plan: string) {
    this.subscriptionActions.inc({ action: "past_due", plan });
  }

  // ─── Quota ─────────────────────────────────────────────

  recordQuotaCheck(
    resource: string,
    result: "allowed" | "exceeded",
    cache: "l1" | "redis" | "db",
    durationMs: number,
  ) {
    this.quotaChecks.inc({ resource, result, cache });
    this.quotaCheckDuration.observe({ cache }, durationMs / 1000);
  }

  // ─── Usage ─────────────────────────────────────────────

  recordUsageIncrement(resource: string) {
    this.usageIncrements.inc({ resource });
  }

  // ─── Stripe ────────────────────────────────────────────

  recordStripeWebhook(
    event: string,
    status: "success" | "failed" | "duplicate",
    durationMs: number,
  ) {
    this.stripeWebhooks.inc({ event, status });
    this.stripeWebhookDuration.observe({ event }, durationMs / 1000);
  }

  // ─── Cache ─────────────────────────────────────────────

  recordCacheHit(
    layer: "l1" | "redis",
    keyType: "quota" | "subscription" | "invoices",
  ) {
    this.cacheHits.inc({ layer, key_type: keyType });
  }

  recordCacheMiss(
    layer: "l1" | "redis",
    keyType: "quota" | "subscription" | "invoices",
  ) {
    this.cacheMisses.inc({ layer, key_type: keyType });
  }

  setRedisAvailable(available: boolean) {
    this.redisAvailable.set(available ? 1 : 0);
  }
}
