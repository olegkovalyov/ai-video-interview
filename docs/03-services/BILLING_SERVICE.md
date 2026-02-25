# Billing Service

**Status:** 🔴 Not Implemented  
**Port:** 3010  
**Technology Stack:** NestJS, TypeORM, PostgreSQL, Stripe API, Redis  
**Priority:** MEDIUM (Required for monetization)

---

## Overview

Billing Service manages subscriptions, payments, and usage quotas for the AI Video Interview platform. Implements a freemium model with tiered pricing.

**Key Capabilities:**
- Subscription management (Stripe integration)
- Usage tracking and quota enforcement
- Invoice generation
- Payment webhook processing
- Feature gating based on plan

---

## Pricing Tiers

### Tier Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRICING PLANS                                       │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────┤
│     Feature     │      FREE       │      PLUS       │        PRO          │
├─────────────────┼─────────────────┼─────────────────┼─────────────────────┤
│ Price           │ $0/month        │ $29/month       │ $99/month           │
│ Interviews/mo   │ 3               │ 100             │ Unlimited           │
│ AI Analysis     │ Basic scoring   │ Full analysis   │ Full + Compare      │
│ Video Storage   │ 500 MB          │ 10 GB           │ 100 GB              │
│ Team Members    │ 1               │ 5               │ Unlimited           │
│ Templates       │ 3               │ 25              │ Unlimited           │
│ Export          │ ❌              │ PDF             │ PDF + CSV + API     │
│ Support         │ Community       │ Email           │ Priority + Chat     │
│ Custom Branding │ ❌              │ ❌              │ ✅                  │
│ API Access      │ ❌              │ Limited         │ Full                │
│ Webhooks        │ ❌              │ ❌              │ ✅                  │
│ SSO/SAML        │ ❌              │ ❌              │ ✅                  │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────┘
```

### Plan Configuration

```yaml
plans:
  free:
    id: plan_free
    name: Free
    price_monthly: 0
    limits:
      interviews_per_month: 3
      storage_bytes: 524288000  # 500 MB
      team_members: 1
      templates: 3
      ai_analysis_level: basic
    features:
      - basic_analysis
      
  plus:
    id: plan_plus
    stripe_price_id: price_xxxxxxxxxxxxx
    name: Plus
    price_monthly: 29
    limits:
      interviews_per_month: 100
      storage_bytes: 10737418240  # 10 GB
      team_members: 5
      templates: 25
      ai_analysis_level: full
    features:
      - full_analysis
      - pdf_export
      - email_support
      - api_limited
      
  pro:
    id: plan_pro
    stripe_price_id: price_yyyyyyyyyyyyy
    name: Pro
    price_monthly: 99
    limits:
      interviews_per_month: -1  # unlimited
      storage_bytes: 107374182400  # 100 GB
      team_members: -1  # unlimited
      templates: -1  # unlimited
      ai_analysis_level: full_compare
    features:
      - full_analysis
      - candidate_compare
      - pdf_export
      - csv_export
      - api_full
      - webhooks
      - custom_branding
      - priority_support
      - sso_saml
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   BILLING SERVICE (3010)                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                  HTTP Layer                                │ │
│  │  - SubscriptionController                                  │ │
│  │  - WebhookController (Stripe)                             │ │
│  │  - UsageController                                         │ │
│  │  - InvoiceController                                       │ │
│  └───────────────────────────┬───────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │              Application Layer (CQRS)                      │ │
│  │  Commands:                    Queries:                     │ │
│  │  - CreateSubscription         - GetSubscription            │ │
│  │  - UpgradeSubscription        - GetUsage                   │ │
│  │  - CancelSubscription         - GetInvoices                │ │
│  │  - RecordUsage                - CheckQuota                 │ │
│  │  - ProcessPayment             - GetBillingHistory          │ │
│  └───────────────────────────┬───────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │              Domain Layer                                  │ │
│  │  - Subscription (Aggregate)                                │ │
│  │  - UsageRecord (Entity)                                    │ │
│  │  - Invoice (Entity)                                        │ │
│  │  - Plan (Value Object)                                     │ │
│  │  - Quota (Value Object)                                    │ │
│  └───────────────────────────┬───────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │              Infrastructure Layer                          │ │
│  │  - StripeService                                           │ │
│  │  - SubscriptionRepository                                  │ │
│  │  - UsageRepository                                         │ │
│  │  - QuotaCache (Redis)                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    PostgreSQL      Stripe API      Redis         Kafka
```

---

## Stripe Integration

### Webhook Events

| Stripe Event | Action |
|--------------|--------|
| `checkout.session.completed` | Create/activate subscription |
| `customer.subscription.updated` | Update plan limits |
| `customer.subscription.deleted` | Deactivate subscription |
| `invoice.paid` | Record payment, reset usage |
| `invoice.payment_failed` | Send notification, grace period |
| `customer.subscription.trial_will_end` | Send reminder |

### Checkout Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Stripe Checkout Flow                         │
│                                                                 │
│  1. User clicks "Upgrade to Plus"                              │
│     │                                                          │
│     ▼                                                          │
│  2. Frontend: POST /api/billing/checkout                       │
│     │                                                          │
│     ▼                                                          │
│  3. Billing Service creates Stripe Checkout Session            │
│     - price_id: price_xxxxx                                    │
│     - customer_email: user@example.com                         │
│     - success_url: /billing/success?session_id={CHECKOUT_ID}   │
│     - cancel_url: /billing/cancel                              │
│     │                                                          │
│     ▼                                                          │
│  4. Return checkout URL → Frontend redirects to Stripe         │
│     │                                                          │
│     ▼                                                          │
│  5. User completes payment on Stripe                           │
│     │                                                          │
│     ▼                                                          │
│  6. Stripe sends webhook: checkout.session.completed           │
│     │                                                          │
│     ▼                                                          │
│  7. Billing Service activates subscription                     │
│     - Update DB                                                │
│     - Reset quotas                                             │
│     - Publish billing.subscription_created event               │
│     │                                                          │
│     ▼                                                          │
│  8. User redirected to success page                            │
└─────────────────────────────────────────────────────────────────┘
```

### Customer Portal

```
GET /api/billing/portal

→ Creates Stripe Customer Portal session
→ User can:
  - Update payment method
  - View invoices
  - Cancel subscription
  - Upgrade/downgrade plan
```

---

## Usage Tracking

### Tracked Metrics

| Metric | Reset Period | Stored In |
|--------|--------------|-----------|
| `interviews_created` | Monthly | PostgreSQL + Redis |
| `storage_used_bytes` | Never (cumulative) | PostgreSQL |
| `ai_analysis_count` | Monthly | PostgreSQL + Redis |
| `api_calls` | Monthly | Redis only |

### Quota Check Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Quota Check Flow                             │
│                                                                 │
│  1. API Gateway: User creates interview                        │
│     │                                                          │
│     ▼                                                          │
│  2. Check Redis cache for current usage                        │
│     │                                                          │
│     ├─── Cache hit: Compare with plan limits                   │
│     │    │                                                     │
│     │    ├─── Under limit: Allow + Increment counter           │
│     │    │                                                     │
│     │    └─── Over limit: Return 402 Payment Required          │
│     │                                                          │
│     └─── Cache miss: Query DB → Update cache → Check           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Redis Cache Structure

```
# Current usage counters (expire monthly)
billing:usage:{userId}:interviews_created = 5
billing:usage:{userId}:ai_analysis_count = 12

# Plan limits cache (expire on plan change)
billing:limits:{userId}:interviews_per_month = 100
billing:limits:{userId}:storage_bytes = 10737418240

# TTL: End of current billing period
```

---

## Kafka Integration

### Subscribed Topics

| Topic | Event | Action |
|-------|-------|--------|
| `interview-events` | `interview.created` | Increment usage counter |
| `media-events` | `media.uploaded` | Update storage usage |
| `analysis-events` | `analysis.completed` | Increment AI analysis counter |
| `user-events` | `user.created` | Create free subscription |

### Published Topics

| Topic | Event | Trigger |
|-------|-------|---------|
| `billing-events` | `subscription.created` | New subscription |
| `billing-events` | `subscription.upgraded` | Plan upgrade |
| `billing-events` | `subscription.cancelled` | Cancellation |
| `billing-events` | `quota.exceeded` | Limit reached |
| `billing-events` | `payment.failed` | Payment failure |

### Event Schemas

**subscription.created**
```json
{
  "eventId": "uuid",
  "eventType": "subscription.created",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "userId": "uuid",
    "subscriptionId": "uuid",
    "plan": "plus",
    "stripeSubscriptionId": "sub_xxxxx",
    "currentPeriodStart": "2025-01-01T00:00:00Z",
    "currentPeriodEnd": "2025-02-01T00:00:00Z"
  }
}
```

**quota.exceeded**
```json
{
  "eventId": "uuid",
  "eventType": "quota.exceeded",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "userId": "uuid",
    "quotaType": "interviews_per_month",
    "currentUsage": 100,
    "limit": 100,
    "plan": "plus",
    "suggestedUpgrade": "pro"
  }
}
```

---

## Database Schema

### Tables

**subscriptions**
```
┌─────────────────────────────────────────────────────────────────┐
│ subscriptions                                                   │
├─────────────────────────────────────────────────────────────────┤
│ id                      UUID PRIMARY KEY                        │
│ user_id                 UUID NOT NULL UNIQUE (FK → users)       │
│ plan_id                 VARCHAR(50) NOT NULL                    │
│ status                  ENUM('active','cancelled','past_due',   │
│                              'trialing','paused')               │
│ stripe_customer_id      VARCHAR(255)                            │
│ stripe_subscription_id  VARCHAR(255)                            │
│ current_period_start    TIMESTAMP                               │
│ current_period_end      TIMESTAMP                               │
│ cancel_at_period_end    BOOLEAN DEFAULT FALSE                   │
│ cancelled_at            TIMESTAMP                               │
│ trial_end               TIMESTAMP                               │
│ created_at              TIMESTAMP                               │
│ updated_at              TIMESTAMP                               │
└─────────────────────────────────────────────────────────────────┘
```

**usage_records**
```
┌─────────────────────────────────────────────────────────────────┐
│ usage_records                                                   │
├─────────────────────────────────────────────────────────────────┤
│ id                      UUID PRIMARY KEY                        │
│ subscription_id         UUID NOT NULL (FK → subscriptions)      │
│ period_start            TIMESTAMP NOT NULL                      │
│ period_end              TIMESTAMP NOT NULL                      │
│ interviews_created      INTEGER DEFAULT 0                       │
│ ai_analysis_count       INTEGER DEFAULT 0                       │
│ storage_used_bytes      BIGINT DEFAULT 0                        │
│ api_calls               INTEGER DEFAULT 0                       │
│ created_at              TIMESTAMP                               │
│ updated_at              TIMESTAMP                               │
└─────────────────────────────────────────────────────────────────┘

-- Unique constraint for one record per period
UNIQUE (subscription_id, period_start)
```

**invoices**
```
┌─────────────────────────────────────────────────────────────────┐
│ invoices                                                        │
├─────────────────────────────────────────────────────────────────┤
│ id                      UUID PRIMARY KEY                        │
│ subscription_id         UUID NOT NULL (FK → subscriptions)      │
│ stripe_invoice_id       VARCHAR(255) UNIQUE                     │
│ amount_cents            INTEGER NOT NULL                        │
│ currency                VARCHAR(3) DEFAULT 'usd'                │
│ status                  ENUM('draft','open','paid','void',      │
│                              'uncollectible')                   │
│ invoice_pdf_url         TEXT                                    │
│ period_start            TIMESTAMP                               │
│ period_end              TIMESTAMP                               │
│ paid_at                 TIMESTAMP                               │
│ created_at              TIMESTAMP                               │
└─────────────────────────────────────────────────────────────────┘
```

**plans**
```
┌─────────────────────────────────────────────────────────────────┐
│ plans                                                           │
├─────────────────────────────────────────────────────────────────┤
│ id                      VARCHAR(50) PRIMARY KEY                 │
│ name                    VARCHAR(100) NOT NULL                   │
│ price_monthly_cents     INTEGER NOT NULL                        │
│ stripe_price_id         VARCHAR(255)                            │
│ limits                  JSONB NOT NULL                          │
│ features                TEXT[] NOT NULL                         │
│ is_active               BOOLEAN DEFAULT TRUE                    │
│ sort_order              INTEGER                                 │
│ created_at              TIMESTAMP                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Subscription Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/subscription` | Get current subscription |
| `POST` | `/api/v1/subscription/checkout` | Create checkout session |
| `POST` | `/api/v1/subscription/portal` | Get customer portal URL |
| `POST` | `/api/v1/subscription/cancel` | Cancel subscription |
| `POST` | `/api/v1/subscription/resume` | Resume cancelled subscription |

### Usage & Quotas

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/usage` | Get current period usage |
| `GET` | `/api/v1/usage/history` | Get historical usage |
| `GET` | `/api/v1/quota/check/:resource` | Check specific quota |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/invoices` | List all invoices |
| `GET` | `/api/v1/invoices/:id` | Get invoice details |
| `GET` | `/api/v1/invoices/:id/pdf` | Download invoice PDF |

### Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/plans` | List all available plans |
| `GET` | `/api/v1/plans/:id` | Get plan details |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/webhooks/stripe` | Stripe webhook handler |

### Internal Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/internal/usage/increment` | Increment usage (service-to-service) |
| `GET` | `/internal/quota/:userId/:resource` | Check quota (service-to-service) |

---

## Quota Enforcement

### API Gateway Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                API Gateway Quota Middleware                     │
│                                                                 │
│  For protected endpoints that consume quotas:                   │
│                                                                 │
│  1. Extract userId from JWT                                     │
│  2. Call Billing Service: GET /internal/quota/{userId}/{type}  │
│  3. If quota available:                                         │
│     - Forward request to service                                │
│     - On success: POST /internal/usage/increment               │
│  4. If quota exceeded:                                          │
│     - Return 402 Payment Required                               │
│     - Include upgrade suggestion in response                    │
└─────────────────────────────────────────────────────────────────┘
```

### Response on Quota Exceeded

```json
{
  "statusCode": 402,
  "error": "Payment Required",
  "message": "Monthly interview limit reached",
  "details": {
    "quotaType": "interviews_per_month",
    "currentUsage": 3,
    "limit": 3,
    "currentPlan": "free",
    "upgradeUrl": "/billing/upgrade",
    "suggestedPlan": "plus"
  }
}
```

---

## Configuration

### Environment Variables

```bash
# Application
PORT=3010
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ai_video_interview_billing
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# Stripe Price IDs
STRIPE_PRICE_PLUS_MONTHLY=price_xxxxxxxxxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxx

# URLs
FRONTEND_URL=http://localhost:3000
BILLING_SUCCESS_URL=http://localhost:3000/billing/success
BILLING_CANCEL_URL=http://localhost:3000/billing/cancel

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=billing-service
KAFKA_GROUP_ID=billing-service-group

# Observability
LOG_LEVEL=debug
LOKI_HOST=http://localhost:3100
```

---

## Security

### Stripe Webhook Verification

```
All Stripe webhooks are verified using:
- stripe.webhooks.constructEvent(payload, signature, webhookSecret)

Webhook endpoint must:
- Accept raw body (not JSON parsed)
- Verify signature before processing
- Return 200 quickly, process async
```

### Internal Endpoint Protection

```
Internal endpoints (/internal/*) are protected by:
- X-Internal-Service-Token header
- IP whitelist (internal network only)
- No external access through API Gateway
```

---

## Metrics & Monitoring

### Prometheus Metrics

```
billing_subscriptions_total{plan="free|plus|pro",status="active|cancelled"}
billing_revenue_cents_total{plan="plus|pro"}
billing_quota_checks_total{result="allowed|exceeded"}
billing_stripe_webhook_total{event="checkout.session.completed|..."}
billing_usage_increments_total{type="interviews|storage|analysis"}
```

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| PaymentFailureRate | >5% in 1h | Critical |
| WebhookProcessingDelay | >5min | Warning |
| QuotaExceededSpike | >100/hour | Info |

---

## Implementation Phases

### Phase 1: Foundation
- [ ] NestJS project setup
- [ ] Database schema + migrations
- [ ] Plan configuration
- [ ] Basic subscription CRUD

### Phase 2: Stripe Integration
- [ ] Stripe customer creation
- [ ] Checkout session flow
- [ ] Webhook processing
- [ ] Customer portal

### Phase 3: Usage Tracking
- [ ] Kafka consumers for usage events
- [ ] Redis caching layer
- [ ] Quota check endpoints
- [ ] API Gateway integration

### Phase 4: Production
- [ ] Invoice management
- [ ] Usage reports
- [ ] Metrics & monitoring
- [ ] Grace period handling

---

**Last Updated:** 2025-01-XX
