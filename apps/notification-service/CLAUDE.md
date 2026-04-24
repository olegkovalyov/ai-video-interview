# Notification Service

## Overview

Domain-driven microservice responsible for email, in-app, and webhook notifications triggered by domain events across all platform services. Implements DDD + CQRS + Clean Architecture.

- **Port**: 8006
- **Database**: PostgreSQL 15 (`ai_video_interview_notification`)
- **Architecture**: DDD + CQRS + Clean Architecture

## Tech Stack

- NestJS 11, TypeScript 5
- @nestjs/cqrs (command/query bus, event bus)
- TypeORM 0.3 (PostgreSQL, migrations)
- nodemailer (SMTP email delivery, Mailpit in dev)
- Handlebars (email template rendering)
- kafkajs (event consumption + publishing via Outbox)
- BullMQ (Outbox job processing, webhook delivery)
- Redis (BullMQ + pub/sub for in-app notifications)
- prom-client (Prometheus metrics)
- Winston (structured logging)
- Jest 30 (testing)

## Architecture

```
src/
  domain/
    aggregates/
      notification.aggregate.ts        # Notification lifecycle (pending->queued->sent->failed->bounced)
      webhook-endpoint.aggregate.ts    # Webhook management (active/disabled, failure tracking)
    entities/
      notification-preference.entity.ts # Per-user notification preferences
    value-objects/
      channel.vo.ts                    # email | in_app | webhook
      notification-status.vo.ts        # pending | queued | sent | failed | bounced
      notification-template.vo.ts      # Template name enum
    events/
      notification-sent.event.ts
      notification-failed.event.ts
    exceptions/
      notification.exceptions.ts
    repositories/
      notification.repository.interface.ts
      webhook-endpoint.repository.interface.ts
      notification-preference.repository.interface.ts
    base/                              # AggregateRoot, Entity, ValueObject
  application/
    commands/                          # 5 commands
      send-notification/
      process-webhook-delivery/
      update-preferences/
      register-webhook/
      mark-notification-read/
    queries/                           # 4 queries
      list-notifications/
      get-preferences/
      list-webhook-endpoints/
      get-unread-count/
    event-handlers/
    dto/
    interfaces/
      outbox-service.interface.ts
      unit-of-work.interface.ts
      email-service.interface.ts
  infrastructure/
    persistence/
      entities/                        # TypeORM entities
      repositories/                    # TypeORM implementations
      mappers/                         # Domain <-> Entity mappers
      migrations/
      unit-of-work/
    email/
      smtp-email.service.ts            # IEmailService implementation (nodemailer)
      template-renderer.service.ts     # Handlebars template compilation
      templates/*.hbs                  # 12 email templates + layout
    realtime/
      realtime.service.ts              # Redis pub/sub publisher for in-app
    webhook/
      webhook-delivery.processor.ts    # BullMQ worker for webhook HTTP POST
    kafka/consumers/                   # user-events, interview-events, analysis-events, billing-events
    messaging/outbox/                  # Outbox pattern (same as billing-service)
    scheduling/
      reminder.scheduler.ts            # Invitation reminder 24h before expiry
      digest.scheduler.ts              # Weekly digest Monday 9am
    http/
      controllers/
        notification.controller.ts     # list, mark read, unread count
        preferences.controller.ts      # get/update preferences
        webhook.controller.ts          # register/list/delete webhooks
        health.controller.ts
      guards/
      filters/
      interceptors/
    logger/
    metrics/
    tracing/
  config/
    env.validation.ts
    templates.config.ts                # Template name -> subject line mapping
```

## Domain Model

### Notification Aggregate (State Machine)

```
  pending ---[markQueued()]---> queued ---[markSent()]---> sent
    |                             |
    +---[markFailed(err)]----> failed
    +---[markBounced()]------> bounced
```

### Email Templates

| Template              | Trigger Event          | Recipient |
| --------------------- | ---------------------- | --------- |
| `welcome`             | user.created           | User      |
| `invitation`          | invitation.created     | Candidate |
| `invitation_reminder` | Scheduled (24h before) | Candidate |
| `interview_started`   | invitation.started     | HR        |
| `interview_completed` | invitation.completed   | HR        |
| `analysis_ready`      | analysis.completed     | HR        |
| `analysis_failed`     | analysis.failed        | HR        |
| `payment_confirmed`   | subscription.upgraded  | HR        |
| `payment_failed`      | subscription.past_due  | HR        |
| `quota_exceeded`      | quota.exceeded         | HR        |
| `weekly_digest`       | Scheduled (Monday 9am) | HR        |

## Kafka Integration

### Consumed Events

- `user-events` -> `user.created` -> welcome email, `user.role-selected` -> confirmation
- `interview-events` -> `invitation.created` -> invitation email, `invitation.started` -> notify HR, `invitation.completed` -> notify HR
- `analysis-events` -> `analysis.completed` -> analysis ready email, `analysis.failed` -> notify HR
- `billing-events` -> `subscription.upgraded` -> payment confirmed, `subscription.past_due` -> payment failed, `quota.exceeded` -> upgrade reminder

### Published Events (via Outbox -> notification-events)

- `notification.sent`
- `notification.failed`

## Commands

```bash
cd apps/notification-service
npm run start:dev          # Development with hot reload
npm run build              # Production build
npm run test               # Unit tests
npm run test:cov           # Coverage report
npm run migration:generate # Generate new migration
npm run migration:run      # Run pending migrations
```

## Environment Variables

| Variable          | Description                                     |
| ----------------- | ----------------------------------------------- |
| PORT              | Server port (default: 8006)                     |
| DATABASE_HOST     | PostgreSQL host                                 |
| DATABASE_PORT     | PostgreSQL port (default: 5432)                 |
| DATABASE_NAME     | Database name (ai_video_interview_notification) |
| DATABASE_USER     | Database username                               |
| DATABASE_PASSWORD | Database password                               |
| SMTP_HOST         | SMTP server host (localhost for Mailpit)        |
| SMTP_PORT         | SMTP server port (1025 for Mailpit)             |
| SMTP_SECURE       | Use TLS (default: false)                        |
| SMTP_USER         | SMTP username (optional for Mailpit)            |
| SMTP_PASSWORD     | SMTP password (optional for Mailpit)            |
| SMTP_FROM         | Sender email address                            |
| FRONTEND_URL      | Frontend URL for email links                    |
| KAFKA_BROKERS     | Kafka broker addresses                          |
| REDIS_HOST        | Redis host for BullMQ and pub/sub               |

## Testing

- **Domain layer**: Test notification state transitions, value object validation, webhook failure counting
- **Application layer**: Test command handlers with mocked repos and email service, verify correct events emitted
- **Integration**: Test full notification flow with test database and Mailpit

---

## Skills & Best Practices

### Notification Channel Adapter Pattern

- **Port per channel**: `IEmailService`, `IRealtimeService`, `IWebhookDeliveryService` — each channel is a port in application layer. Adapters (`SmtpEmailService`, `RedisRealtimeService`, `AxiosWebhookDeliveryService`) live in infrastructure. Enables swapping SMTP provider (Mailpit dev → SES prod → SendGrid) without touching domain or handlers.
- **Channel selection at send time**: `SendNotificationHandler` reads `NotificationPreference` for recipient, fans out to enabled channels. Each channel emits its own `notification.sent` event — allows per-channel delivery tracking.
- **Per-channel retry policy**: email retries 3 times (BullMQ exponential backoff 2s base). Webhooks retry 5 times with longer delays (webhooks may be slow). In-app has no retry (real-time is best-effort).

### Email Template Patterns

- **Handlebars compilation is cached**: templates compiled once at startup in `TemplateRendererService`; runtime just calls the compiled function. Never re-read + compile per email — expensive.
- **Layout + partial pattern**: `templates/layouts/base.hbs` wraps every email. Partials (`templates/partials/button.hbs`, `footer.hbs`) reused across templates. Changes to branding = edit layout + partials, never individual templates.
- **Subject from config**: `templates.config.ts` maps template name → subject. Keeps template files focused on body; enables i18n subjects later.
- **i18n-ready from day one**: template names don't encode language (`invitation.hbs`, not `invitation_en.hbs`). Locale selection via directory prefix (`templates/en/invitation.hbs`, `templates/ru/invitation.hbs`) when we add Russian/other locales.
- **Preview header**: every email has a preview line (80 chars) as first visible text — shown in inbox list. Don't waste it on "Hi,".
- **Plain text fallback**: generate text version from HTML automatically via `html-to-text`. Mail clients that don't render HTML still show readable content.
- **Unsubscribe link mandatory**: every email must include unsubscribe link. Legal requirement (CAN-SPAM, GDPR). Link lands on `/notifications/unsubscribe?token=...`.

### Webhook Delivery Patterns

- **Signed payloads**: webhook HTTP requests include `X-Signature` header = HMAC-SHA256 of body with per-endpoint secret. Consumers verify — prevents spoofed webhooks.
- **At-most-once for specific events, at-least-once for others**: configurable per endpoint. By default, retry-with-dedup (endpoint must be idempotent). For sensitive events (billing), at-most-once with no retry.
- **Timeout is strict**: webhook receiver has 5 seconds. Slow receivers don't get special treatment — we log & move on.
- **Auto-disable flaky endpoints**: after 50 consecutive failures, endpoint auto-disabled (status → `disabled`). User must manually re-enable. Prevents us from hammering a dead URL forever.
- **Circuit breaker per endpoint**: wrap delivery with our circuit breaker utility — 3-state gate prevents cascading failures when a recipient goes down.

### Real-time (In-App) Notifications

- **Redis pub/sub for fanout**: `RealtimeService.publish()` puts message on `notifications:{userId}` channel. Web service subscribes per connected user via Socket.IO. Low latency (<50ms), no persistence — for ephemeral UX (toast, badge update).
- **Persistent table for history**: parallel write to `notification` table so `/notifications` page shows history. Separation of concerns: pub/sub = delivery; table = history.
- **Unread badge via count**: `GET /notifications/unread-count` = `SELECT COUNT(*) FROM notification WHERE userId = ? AND readAt IS NULL`. Simple, cheap, cacheable.
- **Mark-read is bulk-friendly**: `PATCH /notifications/read` accepts array of IDs. Frontend batches — don't make N requests for N notifications.

### Scheduling Patterns

- **BullMQ delayed jobs for one-time schedules**: invitation reminder 24h before expiry = enqueue job with `delay: 24 * 60 * 60 * 1000` when invitation is created. Cancel job if invitation completes early.
- **Cron jobs for recurring**: weekly digest = BullMQ repeatable job with `{ cron: '0 9 * * 1' }` (Monday 9am). One job definition, one consumer.
- **Idempotent by design**: every scheduled job includes a business-key `jobId` (e.g., `jobId: 'digest-${userId}-${isoWeek}'`). Preventing duplicate enqueue across process restarts.
- **Time zone awareness**: schedule in user's timezone for digest. Store `User.timezone` and compute per-user cron expression (or use a single UTC cron + filter per-user).

### Kafka Consumer Patterns (Notification Specific)

- **Consumer per event category**: `UserEventsConsumer`, `InterviewEventsConsumer`, `AnalysisEventsConsumer`, `BillingEventsConsumer`. One consumer group per service (`notification-service`). Each consumer delegates to `SendNotificationCommand` with template name mapped from event type.
- **Graceful degradation**: if email backend is down, webhook delivery still runs. Don't fail the Kafka consumer entirely on one channel failure.
- **Heartbeat during long processing**: rendering + sending can take seconds for complex templates. Call `heartbeat()` every 1s to avoid consumer eviction.
- **Dead letter for template errors**: if template rendering fails (missing field, syntax error), send to DLQ with `template_name`, `payload`, `error_stacktrace`. Template errors are bugs, not transient — fix template, replay from DLQ.

### Outbox (Notification Specific)

- **Publish `notification.sent` / `notification.failed`**: downstream analytics tracks delivery rates per template. Include `notificationId`, `channel`, `template`, `recipientId`, `outcome` in payload.
- **Same Outbox pattern as user-service**: see [user-service/CLAUDE.md → Outbox Pattern Best Practices](../user-service/CLAUDE.md#outbox-pattern-best-practices).

### Security (Notification Specific)

- **Never include secrets in email bodies**: password reset links use short-lived (15 min) tokens, not passwords. Tokens are single-use.
- **Subject line PII minimization**: "New invitation from Acme" is safer than "John, you're invited to Acme by hrmanager@acme.com". Assume subjects are logged server-side.
- **Webhook payload scrubbing**: when retrying a webhook, don't log the full payload (may contain PII). Log `endpoint_id`, `event_type`, `delivery_attempt`, `http_status`.
- **Prevent email bombing**: rate-limit per recipient — max 10 emails/hour per user via Redis counter. Protects users from accidental mass-notify bugs.

### PostgreSQL & Indexing (Notification Specific)

- Composite index on `(user_id, read_at, created_at DESC)` for the "unread inbox" query.
- Partial index on `notification(status)` where status = `'failed'` for retry scans.
- `notification.payload` as JSONB with GIN index if we start filtering by payload fields.
- Archive old notifications: partition `notification` table by month, drop partitions > 90 days old. Keeps read queries fast.

### Observability (Notification Specific)

- **Business metrics**:
  - `notification.sent_total{channel, template}` — counter per channel + template.
  - `notification.failed_total{channel, reason}` — counter with failure reason.
  - `notification.delivery_duration_seconds{channel}` — histogram.
  - `webhook.delivery.http_status{endpoint_id}` — counter (careful with cardinality if thousands of endpoints).
- **Log template rendering failures as `error` with full context**: template name, recipient, payload fields available. Don't swallow — these are template bugs.
- **Trace every notification end-to-end**: span kind `CONSUMER` (Kafka) → `INTERNAL` (render) → `CLIENT` (SMTP) → emit log record on success. Full trace tells us where delivery slowed or failed.

### Testing (Notification Specific)

- **Use Mailpit in dev/test**: no real SMTP provider; captures all outbound emails. Assert on Mailpit's API in integration tests: `GET http://localhost:8025/api/v1/messages`.
- **Template rendering golden files**: for every template, store rendered output (HTML + text) as fixture. Diff on CI catches template regressions.
- **Webhook delivery tests use a local echo server**: spin up simple express server in tests that records received calls. Assert request body + signature.
- **Schedule tests use fake timers**: `jest.useFakeTimers()` to fast-forward 24 hours and assert reminder job fires.

### Related Skills

See [.claude/skills/](../../.claude/skills/) for:

- `clean-code` — function size, naming, comments.
- `design-patterns` — Adapter (channels), Template Method (email rendering), Chain of Responsibility (preference filtering).
- `testing-pyramid` — Mailpit integration, template golden files.
- `observability` — RED metrics, trace correlation across async delivery.
