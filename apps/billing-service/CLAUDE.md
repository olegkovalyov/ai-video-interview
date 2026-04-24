# Billing Service

## Overview

Domain-driven microservice responsible for subscription management, payment processing via Stripe, usage tracking, and quota enforcement. Implements DDD + CQRS + Clean Architecture with freemium model (free/plus/pro plans).

- **Port**: 8007
- **Database**: PostgreSQL 15 (`ai_video_interview_billing`)
- **Architecture**: DDD + CQRS + Clean Architecture

## Tech Stack

- NestJS 11, TypeScript 5
- @nestjs/cqrs (command/query bus, event bus)
- TypeORM 0.3 (PostgreSQL, migrations)
- Stripe API (checkout, portal, webhooks)
- kafkajs (event publishing via Outbox)
- BullMQ (Outbox job processing)
- Redis (quota caching)
- prom-client (Prometheus metrics)
- Winston (structured logging)
- Jest 30 (testing)

## Architecture

```
src/
  domain/
    aggregates/
      subscription.aggregate.ts        # Subscription lifecycle (free->active->past_due->canceled)
    entities/
      usage-record.entity.ts           # Per-period usage tracking
      payment-event.entity.ts          # Stripe webhook idempotency
    value-objects/
      plan-type.vo.ts                  # free | plus | pro
      subscription-status.vo.ts        # active | past_due | canceled | trialing
      plan-limits.vo.ts                # interviews, templates, team members limits
    events/
      subscription-created.event.ts
      subscription-upgraded.event.ts
      subscription-canceled.event.ts
      subscription-past-due.event.ts
      quota-exceeded.event.ts
    exceptions/
      billing.exceptions.ts
    repositories/
      subscription.repository.interface.ts
    base/                              # AggregateRoot, Entity, ValueObject
  application/
    commands/                          # 6 commands
      create-free-subscription/
      create-checkout-session/
      process-stripe-webhook/
      cancel-subscription/
      resume-subscription/
      increment-usage/
    queries/                           # 4 queries
      get-subscription/
      get-usage/
      check-quota/
      list-invoices/
    event-handlers/
    dto/
    interfaces/
      outbox-service.interface.ts
      unit-of-work.interface.ts
      stripe-service.interface.ts
  infrastructure/
    persistence/
      entities/                        # TypeORM entities
      repositories/                    # TypeORM implementations
      mappers/                         # Domain <-> Entity mappers
      migrations/
      unit-of-work/
    stripe/                            # Stripe API adapter
    cache/                             # Redis quota cache
    kafka/consumers/                   # user-events, interview-events, analysis-events
    messaging/outbox/                  # Outbox pattern (same as interview-service)
    http/
      controllers/
        billing.controller.ts          # subscription, checkout, portal, cancel, resume, usage, plans, invoices
        webhook.controller.ts          # Stripe webhook with raw body
        health.controller.ts
      guards/
      filters/
      interceptors/
    logger/
    metrics/
    tracing/
  config/
    plans.config.ts                    # Static plan definitions
    env.validation.ts                  # Joi schema
```

## Domain Model

### Subscription Aggregate (State Machine)

```
  active ---[markPastDue()]--> past_due ---[markCanceled()]--> canceled
    |                             |
    |                             +---[renewPeriod()]----> active
    +---[cancel()]---> active (cancelAtPeriodEnd=true)
    +---[markCanceled()]---> canceled
```

**Business rules**:

- One subscription per company (UNIQUE constraint on companyId)
- Free plan created automatically on company creation (via Kafka user.created)
- Upgrade: free->plus, free->pro, plus->pro (via Stripe Checkout)
- Cancel: sets cancelAtPeriodEnd=true, stays active until period ends
- Resume: undo cancel before period end
- Past due: after failed payment, 7-day grace period

### Plan Configuration (static)

| Plan | Price | Interviews/mo | Templates | Team Members |
| ---- | ----- | ------------- | --------- | ------------ |
| Free | $0    | 3             | 5         | 1            |
| Plus | $29   | 100           | 50        | 5            |
| Pro  | $99   | Unlimited     | Unlimited | Unlimited    |

## Kafka Integration

### Consumed Events

- `user-events` -> `user.created` (with role=hr) -> CreateFreeSubscription
- `interview-events` -> `invitation.completed` -> IncrementUsage(interviews)
- `analysis-events` -> `analysis.completed` -> IncrementUsage(analysisTokens)

### Published Events (via Outbox -> billing-events)

- `subscription.created`
- `subscription.upgraded`
- `subscription.canceled`
- `subscription.past_due`
- `quota.exceeded`

## Commands

```bash
cd apps/billing-service
npm run start:dev          # Development with hot reload
npm run build              # Production build
npm run test               # Unit tests
npm run test:cov           # Coverage report
npm run migration:generate # Generate new migration
npm run migration:run      # Run pending migrations
```

## Environment Variables

| Variable              | Description                                |
| --------------------- | ------------------------------------------ |
| PORT                  | Server port (default: 8007)                |
| DATABASE_HOST         | PostgreSQL host                            |
| DATABASE_PORT         | PostgreSQL port (default: 5432)            |
| DATABASE_NAME         | Database name (ai_video_interview_billing) |
| DATABASE_USER         | Database username                          |
| DATABASE_PASSWORD     | Database password                          |
| STRIPE_SECRET_KEY     | Stripe API secret key                      |
| STRIPE_WEBHOOK_SECRET | Stripe webhook signing secret              |
| STRIPE_PRICE_PLUS     | Stripe Price ID for Plus plan              |
| STRIPE_PRICE_PRO      | Stripe Price ID for Pro plan               |
| FRONTEND_URL          | Frontend URL for redirects                 |
| KAFKA_BROKERS         | Kafka broker addresses                     |
| REDIS_HOST            | Redis host for BullMQ and cache            |

## Testing

- **Domain layer**: Test subscription state transitions, value object validation, plan upgrade/downgrade rules
- **Application layer**: Test command handlers with mocked repos and Stripe, verify correct events emitted
- **Integration**: Test full checkout flow with test database

---

## Skills & Best Practices

### Stripe Integration Patterns

- **Adapter boundary**: Domain and application layers never import `stripe` SDK directly. `IStripeService` port lives in `application/interfaces/`; `StripeService` adapter in `infrastructure/stripe/` is the only place Stripe SDK is imported. Enables swapping/mocking in tests and keeps Stripe specifics isolated from business logic.
- **Webhook idempotency**: Stripe may deliver the same event multiple times. Record every `event.id` in `payment_event` entity with UNIQUE constraint. `ProcessStripeWebhookHandler` checks for existing record first; duplicate = silently return 200. Never trust that the first delivery was the only one.
- **Webhook signature verification is mandatory**: Always use `stripe.webhooks.constructEvent(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET)`. Never parse the body yourself. Controller must receive raw body via `@Req() req: RawBodyRequest<Request>` and `express.raw({ type: 'application/json' })` middleware — JSON parsing destroys the signature.
- **Period dates from invoice.lines, not invoice root**: Stripe's `invoice.period_start` / `invoice.period_end` describe the INVOICE generation window (often the same day). Use `invoice.lines.data[0].period` for the actual subscription period. See `handleInvoicePaid`.
- **Price IDs via env, not hardcoded**: `STRIPE_PRICE_PLUS`, `STRIPE_PRICE_PRO` are environment variables. When launching new plans, add new price IDs to `plans.config.ts` with env lookup. Never commit real price IDs.
- **Customer deduplication**: Before creating a Stripe Customer, check `subscription.stripeCustomerId`. A company has exactly one Stripe Customer even across plan changes.
- **Redirect URLs use absolute paths**: `successUrl` / `cancelUrl` / `returnUrl` must start with `FRONTEND_URL` + path. Default success redirect is `/profile/billing?success=true`, NOT `/billing` — the `/billing` route doesn't exist as a top-level page.
- **Test mode vs live mode**: development uses `sk_test_*` keys, staging and prod use `sk_live_*`. Startup validation in `env.validation.ts` rejects missing keys. Keep them separated in Keycloak realm configs / secret store.

### Subscription State Machine

- **State transitions via aggregate methods only**: `subscription.cancel()`, `subscription.markPastDue()`, `subscription.renewPeriod()` — never directly mutate `status`. Guards inside the aggregate prevent illegal transitions (e.g., you can't resume a canceled subscription, only undo a pending cancel).
- **`cancelAtPeriodEnd` semantics**: calling `cancel()` does NOT immediately revoke access. It sets `cancelAtPeriodEnd=true`; status stays `active`. Only on Stripe's `subscription.deleted` webhook does status flip to `canceled` and access revokes. Respect this on the frontend — show "cancels on DATE" banner.
- **Grace period for past_due**: 7 days in `past_due` before auto-canceling. During this window, quota enforcement stays as if active (don't punish users for a card decline they might fix). After 7 days, scheduled job fires compensating events.
- **Plan downgrade is deferred**: downgrading from Plus to Free does not immediately reduce quota — keeps current period's quota through the end of billing period. Next renewal starts with new (lower) quota.

### Quota Enforcement Patterns

- **Check at ingress, enforce with events**: `CheckQuotaQuery` returns `{ allowed, remaining, limit }` without side effects. Callers (api-gateway, interview-service) consult before the operation. Actual enforcement happens via `IncrementUsageCommand` triggered by `invitation.completed` event consumption.
- **Redis cache for hot path**: current-month usage is cached in Redis with key `quota:{companyId}:{resourceType}:{yyyy-mm}`. TTL = 1 hour. Cache invalidated on every `IncrementUsage`. Falls back to PostgreSQL aggregate if cache miss.
- **Unlimited = `Infinity`**: Pro plan's quota is modeled as `Infinity` in `PlanLimits` VO, not `null`, not `-1`. `isExceeded()` returns false for `Infinity`. Serialization to JSON converts `Infinity` to `"unlimited"` string — frontend displays accordingly.
- **Quota exceeded event**: when usage hits the limit, emit `quota.exceeded` via Outbox. notification-service reacts with upgrade reminder email. Don't block the action that caused overflow — the business decision is to bill gracefully, not error.

### Outbox & Kafka (Billing Specific)

- **All subscription events go through Outbox**: `subscription.created`, `subscription.upgraded`, `subscription.canceled`, `subscription.past_due`, `quota.exceeded`. Consumed by notification-service for emails, by analytics for MRR tracking. At-least-once delivery is critical — a missed `subscription.upgraded` means the customer paid but didn't get the feature.
- **Partition key = companyId**: all subscription events for a single company go to the same Kafka partition — guarantees ordered delivery of state transitions. A consumer always sees `created → upgraded → canceled` in that order for a given company.
- **Stripe webhook handler → Outbox, not direct Kafka**: the handler processes webhook, updates aggregate, saves Outbox event in same transaction. Separate BullMQ worker publishes to Kafka. Webhook returns 200 immediately after DB commit — decouples Stripe delivery from Kafka availability.
- **Replay-safe**: webhook re-delivery or Kafka re-consumption must be idempotent. `payment_event` table for Stripe IDs, `processed_events` table for Kafka event IDs. See also general [Outbox Pattern Best Practices](../user-service/CLAUDE.md#outbox-pattern-best-practices).

### Security (Billing Specific)

- **Stripe keys are production-grade secrets**: `STRIPE_SECRET_KEY` has full account access. Store in Vault / K8s Secrets. Never log. Never commit `.env`. If a key is exposed, rotate immediately via Stripe Dashboard.
- **Webhook secret per environment**: every environment has its own `STRIPE_WEBHOOK_SECRET`. Stripe CLI generates dev secrets; Stripe Dashboard generates staging/prod. Don't reuse.
- **PCI scope minimization**: we do NOT handle card numbers — Stripe Checkout hosts the payment form on Stripe's domain (PCI SAQ A compliance). If we ever collect cards directly (Elements), scope balloons to SAQ A-EP or D.
- **Idempotency-Key header on retries**: when retrying Stripe API calls, pass `Idempotency-Key: <uuid>` — prevents duplicate charges on network retries.
- **Customer Portal URL has short TTL**: portal sessions expire in 1 hour (Stripe default). Generate on-demand, never cache.

### Testing (Billing Specific)

- **Stripe Test Clock for time-based flows**: subscription renewals, trial expirations, past_due transitions — all require time travel. Use Stripe's Test Clock API in integration tests, not real dates.
- **Webhook event fixtures**: cache example webhook payloads (captured via `stripe listen`) in `test/fixtures/webhooks/`. Test handlers against these fixtures rather than mocking Stripe API calls in handlers.
- **Contract test against real Stripe test API**: one integration test per checkout flow, running against `sk_test_*` keys in CI. Validates that our assumptions about Stripe response shape still hold.
- **Quota simulation**: tests that verify quota enforcement should seed `usage_record` rows directly rather than simulating 100 invitations — much faster.

### PostgreSQL & Indexing (Billing Specific)

- Composite index on `(company_id, period_start)` for `usage_record` — most queries filter by company + current period.
- Partial index on `subscription(status)` where status = `'past_due'` — efficient scan for the past_due cleanup job.
- `payment_event.event_id` UNIQUE constraint — enforces webhook idempotency at DB level, not just application.
- `outbox` table vacuum aggressively: `autovacuum_vacuum_scale_factor = 0.01` — billing events are high-volume + short-lived.

### Observability (Billing Specific)

- **Business metrics to expose at `/metrics`**:
  - `billing.subscription.active{plan}` — gauge per plan type.
  - `billing.mrr` — gauge, unit `{USD}`.
  - `billing.stripe.webhook.received{event_type}` — counter.
  - `billing.stripe.webhook.processing_duration_seconds{event_type}` — histogram.
  - `billing.quota.exceeded{resource_type}` — counter.
- **PII redaction in webhook logs**: never log full Stripe Customer email or full payment method fingerprint. Log `customer_id`, `subscription_id`, `event_id`, `event_type` only.
- **Trace context from webhook through Outbox**: Stripe webhooks don't carry `traceparent`. Generate a new trace at webhook handler entry; propagate via Outbox event metadata so downstream services see the full picture.

### Related Skills

See [.claude/skills/](../../.claude/skills/) for:

- `clean-code` — hard limits (function length, params, nesting).
- `design-patterns` — Adapter (Stripe), State (Subscription), Outbox (event publishing).
- `testing-pyramid` — test layers + coverage targets.
- `observability` — logging/tracing/metrics conventions.
- `typescript-advanced` — branded IDs, discriminated unions for subscription status.
