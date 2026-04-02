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

  // ─── Email ────────────────────────────────────────────
  private readonly emailsSent: Counter<string>;
  private readonly emailsFailed: Counter<string>;

  // ─── Webhooks ─────────────────────────────────────────
  private readonly webhooksDelivered: Counter<string>;
  private readonly webhooksFailed: Counter<string>;

  // ─── In-App ───────────────────────────────────────────
  private readonly inAppPushed: Counter<string>;

  // ─── Cache ────────────────────────────────────────────
  private readonly cacheHits: Counter<string>;
  private readonly cacheMisses: Counter<string>;

  constructor() {
    collectDefaultMetrics({
      prefix: "notification_service_",
      register,
    });

    // HTTP
    this.httpRequestsTotal = new Counter({
      name: "notification_service_http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status"],
      registers: [register],
    });

    this.httpRequestDuration = new Histogram({
      name: "notification_service_http_request_duration_seconds",
      help: "HTTP request duration in seconds",
      labelNames: ["method", "route", "status"],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [register],
    });

    // Email
    this.emailsSent = new Counter({
      name: "notification_service_emails_sent_total",
      help: "Total emails sent successfully",
      labelNames: ["template"],
      registers: [register],
    });

    this.emailsFailed = new Counter({
      name: "notification_service_emails_failed_total",
      help: "Total emails that failed to send",
      labelNames: ["template"],
      registers: [register],
    });

    // Webhooks
    this.webhooksDelivered = new Counter({
      name: "notification_service_webhooks_delivered_total",
      help: "Total webhooks delivered successfully",
      labelNames: ["event_type"],
      registers: [register],
    });

    this.webhooksFailed = new Counter({
      name: "notification_service_webhooks_failed_total",
      help: "Total webhook deliveries that failed",
      labelNames: ["event_type"],
      registers: [register],
    });

    // In-App
    this.inAppPushed = new Counter({
      name: "notification_service_in_app_pushed_total",
      help: "Total in-app notifications pushed via Redis pub/sub",
      registers: [register],
    });

    // Cache
    this.cacheHits = new Counter({
      name: "notification_service_cache_hits_total",
      help: "Cache hits",
      labelNames: ["layer", "key_type"],
      registers: [register],
    });

    this.cacheMisses = new Counter({
      name: "notification_service_cache_misses_total",
      help: "Cache misses",
      labelNames: ["layer", "key_type"],
      registers: [register],
    });
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

  // ─── Email ────────────────────────────────────────────

  recordEmailSent(template: string) {
    this.emailsSent.inc({ template });
  }

  recordEmailFailed(template: string) {
    this.emailsFailed.inc({ template });
  }

  // ─── Webhooks ─────────────────────────────────────────

  recordWebhookDelivered(eventType: string) {
    this.webhooksDelivered.inc({ event_type: eventType });
  }

  recordWebhookFailed(eventType: string) {
    this.webhooksFailed.inc({ event_type: eventType });
  }

  // ─── In-App ───────────────────────────────────────────

  recordInAppPushed() {
    this.inAppPushed.inc();
  }

  // ─── Cache ────────────────────────────────────────────

  recordCacheHit(layer: "l1" | "redis", keyType: string) {
    this.cacheHits.inc({ layer, key_type: keyType });
  }

  recordCacheMiss(layer: "l1" | "redis", keyType: string) {
    this.cacheMisses.inc({ layer, key_type: keyType });
  }
}
