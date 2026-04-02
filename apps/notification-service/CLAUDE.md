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
