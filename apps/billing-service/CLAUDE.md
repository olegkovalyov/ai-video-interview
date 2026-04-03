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
