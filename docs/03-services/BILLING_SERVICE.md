# Billing Service

**Status:** 🟡 In Development
**Port:** 8007
**Database:** PostgreSQL 15 (`ai_video_interview_billing`)
**Technology Stack:** NestJS 11, TypeORM 0.3, PostgreSQL, Stripe API, Redis 7, Kafka 7.4, BullMQ
**Architecture:** DDD + CQRS + Outbox (same as User/Interview/Analysis services)

---

## Overview

Manages subscriptions, payments, usage tracking, and quota enforcement. Implements freemium model with Stripe Checkout + Customer Portal. Kafka consumers track usage from other services.

---

## Domain Model

### Subscription (Aggregate Root)

```
Lifecycle: free → active → past_due → canceled
                    ↑          ↓
                    +--- active (after payment retry succeeds)
```

```typescript
Subscription {
  id: UUID
  companyId: UUID                    // one subscription per company
  planType: PlanType                 // 'free' | 'plus' | 'pro'
  status: SubscriptionStatus        // 'active' | 'past_due' | 'canceled' | 'trialing'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt?: Date
  trialEnd?: Date
  createdAt: Date
  updatedAt: Date
}
```

**Business Rules:**

- One subscription per company (UNIQUE constraint on companyId)
- Free plan created automatically on company creation (via Kafka `user.created`)
- Upgrade: free→plus, free→pro, plus→pro (via Stripe Checkout)
- Downgrade: pro→plus, pro→free, plus→free (at period end)
- Cancel: sets `cancelAtPeriodEnd=true`, stays active until period ends
- Past due: after failed payment, 7-day grace period, then canceled

### UsageRecord (Entity)

```typescript
UsageRecord {
  id: UUID
  subscriptionId: UUID
  period: string                     // 'YYYY-MM' format
  interviewsUsed: number
  analysisTokensUsed: number
  storageUsedMb: number
  createdAt: Date
  updatedAt: Date
}
// UNIQUE(subscriptionId, period)
```

### PaymentEvent (Entity)

```typescript
PaymentEvent {
  id: UUID
  subscriptionId: UUID
  stripeEventId: string              // UNIQUE — idempotency for webhooks
  eventType: string
  data: Record<string, unknown>      // raw Stripe event payload
  processedAt: Date
}
```

### Value Objects

```typescript
PlanType = "free" | "plus" | "pro";
SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";
```

### Plan Configuration (static, not in DB)

```typescript
const PLANS = {
  free: {
    name: "Free",
    priceMonthly: 0,
    limits: { interviewsPerMonth: 3, maxTemplates: 5, maxTeamMembers: 1 },
    features: ["basic_analysis"],
  },
  plus: {
    name: "Plus",
    priceMonthly: 2900, // cents
    limits: { interviewsPerMonth: 100, maxTemplates: 50, maxTeamMembers: 5 },
    features: ["full_analysis", "pdf_export", "email_support"],
  },
  pro: {
    name: "Pro",
    priceMonthly: 9900,
    limits: { interviewsPerMonth: -1, maxTemplates: -1, maxTeamMembers: -1 }, // unlimited
    features: [
      "full_analysis",
      "pdf_export",
      "csv_export",
      "api_access",
      "webhooks",
      "custom_branding",
      "priority_support",
    ],
  },
};
```

---

## CQRS Commands & Queries

### Commands (6)

| Command                  | Trigger              | Description                                                          |
| ------------------------ | -------------------- | -------------------------------------------------------------------- |
| `CreateFreeSubscription` | Kafka `user.created` | Auto-create free plan for new company                                |
| `CreateCheckoutSession`  | HTTP POST            | Generate Stripe Checkout URL for upgrade                             |
| `ProcessStripeWebhook`   | HTTP POST (Stripe)   | Handle checkout.completed, invoice.paid/failed, subscription.deleted |
| `CancelSubscription`     | HTTP POST            | Set cancelAtPeriodEnd=true                                           |
| `ResumeSubscription`     | HTTP POST            | Undo cancel before period end                                        |
| `IncrementUsage`         | Kafka events         | Increment interviews/analysis/storage counters                       |

### Queries (4)

| Query             | Description                              |
| ----------------- | ---------------------------------------- |
| `GetSubscription` | Current subscription + plan details      |
| `GetUsage`        | Current period usage vs limits           |
| `CheckQuota`      | Can this company do X? (for API Gateway) |
| `ListInvoices`    | Payment history from Stripe              |

---

## Kafka Integration

### Consumed Events

| Topic              | Event                         | Action                             |
| ------------------ | ----------------------------- | ---------------------------------- |
| `user-events`      | `user.created` (with role=hr) | CreateFreeSubscription for company |
| `interview-events` | `invitation.completed`        | IncrementUsage(interviews)         |
| `analysis-events`  | `analysis.completed`          | IncrementUsage(analysisTokens)     |

### Published Events (via Outbox)

| Event                   | Topic            | Trigger                   |
| ----------------------- | ---------------- | ------------------------- |
| `subscription.created`  | `billing-events` | Free plan created         |
| `subscription.upgraded` | `billing-events` | Stripe checkout completed |
| `subscription.canceled` | `billing-events` | Subscription canceled     |
| `subscription.past_due` | `billing-events` | Payment failed            |
| `quota.exceeded`        | `billing-events` | Usage hit plan limit      |

---

## API Endpoints (through API Gateway)

### Public (authenticated via JWT)

| Method | Path                        | Handler                                      |
| ------ | --------------------------- | -------------------------------------------- |
| `GET`  | `/api/billing/subscription` | GetSubscription                              |
| `POST` | `/api/billing/checkout`     | CreateCheckoutSession                        |
| `POST` | `/api/billing/portal`       | CreatePortalSession (Stripe Customer Portal) |
| `POST` | `/api/billing/cancel`       | CancelSubscription                           |
| `POST` | `/api/billing/resume`       | ResumeSubscription                           |
| `GET`  | `/api/billing/usage`        | GetUsage                                     |
| `GET`  | `/api/billing/plans`        | ListPlans (static config)                    |
| `GET`  | `/api/billing/invoices`     | ListInvoices                                 |

### Webhook (no auth, Stripe signature verification)

| Method | Path                           | Handler              |
| ------ | ------------------------------ | -------------------- |
| `POST` | `/api/billing/webhooks/stripe` | ProcessStripeWebhook |

### Internal (x-internal-token)

| Method | Path                                   | Handler    |
| ------ | -------------------------------------- | ---------- |
| `GET`  | `/internal/quota/:companyId/:resource` | CheckQuota |

---

## Stripe Integration Flow

```
CHECKOUT:
  Frontend → POST /api/billing/checkout { planType: 'plus' }
    → Billing creates Stripe Checkout Session
    → Returns { checkoutUrl }
    → Frontend redirects to Stripe
    → User pays
    → Stripe webhook: checkout.session.completed
    → ProcessStripeWebhook handler:
      1. Verify signature
      2. Idempotency check (PaymentEvent table)
      3. Create/update Subscription aggregate
      4. Save via Outbox
      5. Return 200 to Stripe

PORTAL:
  Frontend → POST /api/billing/portal
    → Billing creates Stripe Customer Portal session
    → Returns { portalUrl }
    → User manages payment method, invoices, plan changes

INVOICE LIFECYCLE:
  Stripe webhook: invoice.paid → Reset monthly usage, update period dates
  Stripe webhook: invoice.payment_failed → Mark past_due, 7-day grace
  Stripe webhook: customer.subscription.deleted → Mark canceled
```

---

## Quota Enforcement Flow

```
API Gateway receives POST /api/invitations (create interview)
  → QuotaMiddleware:
    1. Extract companyId from JWT
    2. GET /internal/quota/{companyId}/interviews
    3. Response: { allowed: true, remaining: 97, limit: 100 }
       → Forward to Interview Service
       → Set X-Quota-Remaining: 97 header
    4. Response: { allowed: false, remaining: 0, limit: 3, currentPlan: 'free' }
       → Return 402 { upgradeUrl: '/billing/upgrade' }
```

**Redis Cache:**

```
billing:usage:{companyId}:2026-03    → { interviews: 5, analysis: 12 }    TTL: end of month
billing:plan:{companyId}              → { planType: 'plus', limits: {...} } TTL: 5min
```

---

## Edge Cases

| #   | Case                              | Handling                                           |
| --- | --------------------------------- | -------------------------------------------------- |
| 1   | Double webhook delivery           | PaymentEvent.stripeEventId UNIQUE constraint       |
| 2   | Checkout abandoned                | Session expires after 24h, no subscription created |
| 3   | Payment fails mid-period          | status→past_due, 7-day grace, then canceled        |
| 4   | Downgrade with usage > new limits | Allow until period end, then enforce               |
| 5   | Company with no subscription      | CheckQuota returns free plan defaults              |
| 6   | Concurrent usage increments       | Redis INCR is atomic                               |
| 7   | Stripe webhook before DB ready    | Retry with backoff (Stripe retries for 3 days)     |
| 8   | User cancels then re-subscribes   | New checkout session, new subscription record      |

---

## File Structure

```
apps/billing-service/
├── src/
│   ├── domain/
│   │   ├── base/                          # AggregateRoot, Entity, ValueObject (copy from interview)
│   │   ├── aggregates/
│   │   │   └── subscription.aggregate.ts
│   │   ├── entities/
│   │   │   ├── usage-record.entity.ts
│   │   │   └── payment-event.entity.ts
│   │   ├── value-objects/
│   │   │   ├── plan-type.vo.ts
│   │   │   ├── subscription-status.vo.ts
│   │   │   └── plan-limits.vo.ts
│   │   ├── events/
│   │   │   ├── subscription-created.event.ts
│   │   │   ├── subscription-upgraded.event.ts
│   │   │   ├── subscription-canceled.event.ts
│   │   │   └── quota-exceeded.event.ts
│   │   ├── exceptions/
│   │   │   └── billing.exceptions.ts
│   │   └── repositories/
│   │       └── subscription.repository.interface.ts
│   │
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-free-subscription/
│   │   │   ├── create-checkout-session/
│   │   │   ├── process-stripe-webhook/
│   │   │   ├── cancel-subscription/
│   │   │   ├── resume-subscription/
│   │   │   └── increment-usage/
│   │   ├── queries/
│   │   │   ├── get-subscription/
│   │   │   ├── get-usage/
│   │   │   ├── check-quota/
│   │   │   └── list-invoices/
│   │   ├── event-handlers/
│   │   ├── dto/
│   │   ├── interfaces/
│   │   │   ├── outbox-service.interface.ts
│   │   │   ├── unit-of-work.interface.ts
│   │   │   └── stripe-service.interface.ts
│   │   └── application.module.ts
│   │
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── entities/
│   │   │   │   ├── subscription.entity.ts
│   │   │   │   ├── usage-record.entity.ts
│   │   │   │   ├── payment-event.entity.ts
│   │   │   │   └── outbox.entity.ts
│   │   │   ├── repositories/
│   │   │   │   └── typeorm-subscription.repository.ts
│   │   │   ├── mappers/
│   │   │   │   └── subscription.mapper.ts
│   │   │   ├── migrations/
│   │   │   │   └── 1748000000000-InitialSchema.ts
│   │   │   ├── unit-of-work/
│   │   │   │   └── typeorm-unit-of-work.ts
│   │   │   ├── database.module.ts
│   │   │   └── typeorm.config.ts
│   │   ├── stripe/
│   │   │   ├── stripe.service.ts          # IStripeService implementation
│   │   │   └── stripe.module.ts
│   │   ├── cache/
│   │   │   ├── quota-cache.service.ts     # Redis usage/plan cache
│   │   │   └── cache.module.ts
│   │   ├── kafka/
│   │   │   ├── consumers/
│   │   │   │   ├── user-created.consumer.ts
│   │   │   │   └── usage-tracking.consumer.ts
│   │   │   └── kafka.module.ts
│   │   ├── messaging/
│   │   │   └── outbox/                    # Same pattern as interview-service
│   │   ├── http/
│   │   │   ├── controllers/
│   │   │   │   ├── billing.controller.ts
│   │   │   │   ├── webhook.controller.ts
│   │   │   │   └── health.controller.ts
│   │   │   ├── guards/
│   │   │   │   └── internal-service.guard.ts
│   │   │   ├── filters/
│   │   │   │   ├── domain-exception.filter.ts
│   │   │   │   └── optimistic-lock.filter.ts
│   │   │   └── http.module.ts
│   │   ├── logger/                        # Winston + Loki (copy from interview)
│   │   ├── metrics/                       # Prometheus (copy from interview)
│   │   ├── tracing/                       # OpenTelemetry (copy from interview)
│   │   └── constants.ts
│   │
│   ├── config/
│   │   ├── plans.config.ts                # Static plan definitions
│   │   └── env.validation.ts              # Joi schema
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
│   ├── integration/
│   └── e2e/
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── jest.config.js
├── jest.integration.config.js
└── jest.e2e.config.js
```

---

## Database Schema

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL UNIQUE,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'free',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  period VARCHAR(7) NOT NULL,
  interviews_used INT NOT NULL DEFAULT 0,
  analysis_tokens_used INT NOT NULL DEFAULT 0,
  storage_used_mb DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subscription_id, period)
);

CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR NOT NULL UNIQUE,
  event_type VARCHAR NOT NULL,
  aggregate_id VARCHAR NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  retry_count INT NOT NULL DEFAULT 0,
  error_message VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_usage_records_period ON usage_records(subscription_id, period);
CREATE INDEX idx_payment_events_stripe_event_id ON payment_events(stripe_event_id);
CREATE INDEX idx_outbox_status ON outbox(status);
CREATE INDEX idx_outbox_status_created ON outbox(status, created_at);
```

---

## Environment Variables

```bash
PORT=8007
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ai_video_interview_billing
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
STRIPE_PRICE_PLUS=price_xxxxxxxxxxxx
STRIPE_PRICE_PRO=price_xxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
INTERNAL_SERVICE_TOKEN=...
LOKI_HOST=http://localhost:3100
JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

---

## Implementation Plan

### Phase 1: Scaffold + Domain (2h)

- NestJS project, base classes, domain model, value objects, exceptions
- Subscription aggregate with factory methods and state transitions
- Repository interfaces

### Phase 2: Persistence + Outbox (2h)

- TypeORM entities, mappers, migration
- Database module, UnitOfWork
- Outbox infrastructure (copy from interview-service, adapt)

### Phase 3: Stripe Integration (3h)

- StripeService adapter (IStripeService port)
- CreateCheckoutSession command
- ProcessStripeWebhook command (all event types)
- Webhook controller with raw body + signature verification

### Phase 4: Usage & Quotas (2h)

- Redis QuotaCacheService
- IncrementUsage command
- CheckQuota query
- Kafka consumers (user.created, invitation.completed, analysis.completed)

### Phase 5: HTTP + API Gateway (2h)

- Controllers, DTOs, Swagger docs
- InternalServiceGuard, DomainExceptionFilter
- API Gateway proxy routes + QuotaMiddleware

### Phase 6: Tests (2h)

- Domain: aggregate lifecycle, VO validation, exception mapping
- Application: handler tests with mocked repos and Stripe
- Integration: full checkout flow with test DB

---

_Last Updated: 2026-03-28_
