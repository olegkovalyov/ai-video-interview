# 03 — New Services Design

> Architecture blueprints for Media, Notification, and Billing services.
> Each follows the same DDD + CQRS + Outbox patterns as existing services.

---

## 1. Media Service (Port 8004)

### Purpose

Video/audio storage, processing, and transcription. The backbone of the real interview experience.

### Domain Model

```
MediaFile (Aggregate Root)
  ├── id: UUID
  ├── invitationId: string
  ├── questionId: string
  ├── candidateId: string
  ├── type: 'video' | 'audio' | 'thumbnail'
  ├── status: pending_upload → uploaded → processing → ready | failed
  ├── storage: { bucket, key, size, mimeType, duration }
  ├── transcription?: Transcription (Entity)
  │   ├── text: string
  │   ├── language: string
  │   ├── confidence: number
  │   └── segments: { start, end, text }[]
  └── metadata: { width?, height?, fps?, codec? }

ProcessingJob (Entity)
  ├── type: 'transcode' | 'thumbnail' | 'transcribe'
  ├── status: queued → processing → completed | failed
  ├── input: { mediaFileId, params }
  └── output: { resultKey?, error?, duration? }
```

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│ UPLOAD FLOW (Presigned URL Pattern)                      │
│                                                          │
│ Frontend → API Gateway → Media Service (get presigned)   │
│            ↓                                             │
│         MinIO ← Frontend (direct upload via presigned)   │
│            ↓                                             │
│         Media Service ← MinIO webhook (upload complete)  │
│            ↓                                             │
│         BullMQ Processing Queue:                         │
│         ├── Transcode: WebM → MP4 (H.264, AAC)         │
│         ├── Thumbnail: Extract frame at 1s              │
│         └── Transcribe: Groq Whisper (16kHz mono WAV)   │
│            ↓                                             │
│         Kafka: media-events (media.ready)               │
└──────────────────────────────────────────────────────────┘
```

### Kafka Events

| Event                      | Topic        | Trigger                    | Consumer             |
| -------------------------- | ------------ | -------------------------- | -------------------- |
| `media.upload.requested`   | media-events | Presigned URL generated    | —                    |
| `media.uploaded`           | media-events | File uploaded to MinIO     | Media Service (self) |
| `media.processing.started` | media-events | FFmpeg/Whisper job started | —                    |
| `media.ready`              | media-events | All processing complete    | Interview Service    |
| `media.failed`             | media-events | Processing failed          | Interview Service    |
| `media.deleted`            | media-events | File deleted (retention)   | —                    |

### Key Design Decisions

- **Presigned URLs** — frontend uploads directly to MinIO, never through API Gateway (avoids 100MB+ through Node.js)
- **BullMQ over Kafka** for processing queue — needs job priority, progress tracking, retry with backoff
- **Separate queues** per job type — transcode (CPU-bound, concurrency=2), thumbnail (fast, concurrency=10), transcribe (API-bound, concurrency=1)
- **Groq Whisper** for transcription — same API as analysis, shared rate limit budget
- **Lifecycle management** — auto-delete uploaded but unprocessed files after 24h, auto-delete completed media after retention period

### Database

```sql
-- ai_video_interview_media

CREATE TABLE media_files (
  id UUID PRIMARY KEY,
  invitation_id UUID NOT NULL,
  question_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending_upload',
  bucket VARCHAR(100) NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255),
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  duration_seconds DECIMAL(8,2),
  width INT,
  height INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transcriptions (
  id UUID PRIMARY KEY,
  media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  confidence DECIMAL(3,2),
  segments JSONB,
  model_used VARCHAR(100),
  tokens_used INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY,
  media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  params JSONB,
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Environment Variables

```
PORT=8004
DATABASE_NAME=ai_video_interview_media
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_RECORDINGS=interview-recordings
MINIO_BUCKET_THUMBNAILS=interview-thumbnails
GROQ_API_KEY=...
GROQ_WHISPER_MODEL=whisper-large-v3-turbo
KAFKA_BROKERS=localhost:9092
REDIS_HOST=localhost
FFMPEG_PATH=/usr/bin/ffmpeg
MAX_UPLOAD_SIZE_MB=500
RECORDING_RETENTION_DAYS=180
```

---

## 2. Notification Service (Port 8006)

### Purpose

Email, in-app, and webhook notifications triggered by domain events across all services.

### Domain Model

```
Notification (Aggregate Root)
  ├── id: UUID
  ├── recipientId: string (userId)
  ├── recipientEmail: string
  ├── channel: 'email' | 'in_app' | 'webhook'
  ├── template: string (template name)
  ├── status: pending → sent | failed | bounced
  ├── data: Record<string, unknown> (template variables)
  ├── sentAt?: Date
  ├── error?: string
  └── retryCount: number

NotificationPreference (Aggregate Root)
  ├── userId: string
  └── channels: { email: boolean, in_app: boolean, webhook: boolean }
  └── subscriptions: { interview_completed: boolean, analysis_ready: boolean, ... }

WebhookEndpoint (Aggregate Root)
  ├── companyId: string
  ├── url: string
  ├── secret: string (HMAC-SHA256 signing key)
  ├── events: string[] (subscribed event types)
  ├── status: active | disabled | failed
  └── failureCount: number
```

### Email Templates

| Template               | Trigger Event                 | Recipient    | Variables                                          |
| ---------------------- | ----------------------------- | ------------ | -------------------------------------------------- |
| `welcome`              | user.created                  | Candidate/HR | name, role, loginUrl                               |
| `role_selected`        | user.role-selected            | User         | name, role                                         |
| `interview_invitation` | invitation.created            | Candidate    | name, company, template, link, expiresAt           |
| `interview_reminder`   | Scheduled (24h before expiry) | Candidate    | name, company, link, hoursLeft                     |
| `interview_started`    | invitation.started            | HR (inviter) | candidateName, templateTitle                       |
| `interview_completed`  | invitation.completed          | HR (inviter) | candidateName, templateTitle, responseCount        |
| `analysis_ready`       | analysis.completed            | HR (inviter) | candidateName, score, recommendation, link         |
| `analysis_failed`      | analysis.failed               | HR (inviter) | candidateName, error, retryLink                    |
| `interview_expired`    | invitation expired (cron)     | Candidate    | name, company, templateTitle                       |
| `account_suspended`    | user.suspended                | User         | name, reason, supportEmail                         |
| `password_reset`       | Keycloak event                | User         | name, resetLink                                    |
| `weekly_digest`        | Scheduled (Monday 9am)        | HR           | newCandidates, pendingReviews, completedInterviews |

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│ NOTIFICATION PIPELINE                                    │
│                                                          │
│ Kafka Consumers:                                         │
│ ├── user-events → WelcomeEmail, RoleSelectedEmail       │
│ ├── interview-events → InvitationEmail, CompletedEmail  │
│ ├── analysis-events → AnalysisReadyEmail                │
│ └── auth-events → (future: suspicious login alert)      │
│                                                          │
│ Processing:                                              │
│ ├── Template rendering (Handlebars / React Email)       │
│ ├── Channel routing (email / in-app / webhook)          │
│ ├── Rate limiting (per provider, per recipient)         │
│ └── BullMQ queue with priority                          │
│                                                          │
│ Delivery:                                                │
│ ├── Email: Resend API (primary) / SendGrid (fallback)   │
│ ├── In-app: WebSocket push via Redis pub/sub            │
│ └── Webhook: HMAC-signed HTTP POST with retries         │
└──────────────────────────────────────────────────────────┘
```

### Kafka Consumption

```
CONSUMER GROUP: notification-service

user-events:
  user.created → send welcome email
  user.suspended → send account suspended email
  user.role-selected → send role confirmation email

interview-events:
  invitation.created → send interview invitation email to candidate
  invitation.started → notify HR that candidate started
  invitation.completed → notify HR that candidate finished

analysis-events:
  analysis.completed → send "analysis ready" email to HR
  analysis.failed → send "analysis failed" email to HR
```

### Webhook Delivery

```typescript
// HMAC-SHA256 signed payload
const signature = crypto
  .createHmac("sha256", webhook.secret)
  .update(JSON.stringify(payload))
  .digest("hex");

fetch(webhook.url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Webhook-Signature": `sha256=${signature}`,
    "X-Webhook-Event": eventType,
    "X-Webhook-Delivery": deliveryId,
  },
  body: JSON.stringify(payload),
});

// Retry: 3 attempts, exponential backoff (1s, 5s, 30s)
// After 3 failures: disable webhook, notify admin
```

### Database

```sql
-- ai_video_interview_notification

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  recipient_id UUID NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  template VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  data JSONB NOT NULL DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  error TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  subscriptions JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  url VARCHAR(500) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  events TEXT[] NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  failure_count INT NOT NULL DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Billing Service (Port 8007)

### Purpose

Subscription management, usage tracking, quota enforcement, and payment processing via Stripe.

### Domain Model

```
Subscription (Aggregate Root)
  ├── id: UUID
  ├── companyId: string
  ├── plan: Plan (Value Object)
  │   ├── type: 'free' | 'plus' | 'pro' | 'enterprise'
  │   ├── interviewsPerMonth: number (3 / 100 / unlimited / unlimited)
  │   ├── maxTemplates: number (5 / 50 / unlimited / unlimited)
  │   ├── maxTeamMembers: number (1 / 5 / 25 / unlimited)
  │   ├── features: string[] (video, analytics, api, webhooks, branding, ...)
  │   └── priceMonthly: number (0 / 29 / 99 / custom)
  ├── status: active | past_due | canceled | trialing
  ├── stripeCustomerId: string
  ├── stripeSubscriptionId: string
  ├── currentPeriodStart: Date
  ├── currentPeriodEnd: Date
  └── cancelAt?: Date

UsageRecord (Entity)
  ├── companyId: string
  ├── period: string (YYYY-MM)
  ├── interviewsUsed: number
  ├── templatesCreated: number
  ├── analysisTokensUsed: number
  └── storageUsedMB: number

Invoice (Read Model)
  ├── stripeInvoiceId: string
  ├── amount: number
  ├── status: draft | open | paid | void
  └── pdfUrl: string
```

### Plans

| Feature             | Free            | Plus ($29/mo) | Pro ($99/mo)   | Enterprise |
| ------------------- | --------------- | ------------- | -------------- | ---------- |
| Interviews/month    | 3               | 100           | Unlimited      | Unlimited  |
| Templates           | 5               | 50            | Unlimited      | Unlimited  |
| Team members        | 1               | 5             | 25             | Unlimited  |
| Video recording     | Text only       | Yes           | Yes            | Yes        |
| AI Analysis         | Basic (1 model) | Standard      | Advanced (A/B) | Custom     |
| Analytics dashboard | Basic           | Full          | Full + export  | Custom     |
| API access          | No              | No            | Yes            | Yes        |
| Webhooks            | No              | 3 endpoints   | 10 endpoints   | Unlimited  |
| Custom branding     | No              | Logo only     | Full           | Full       |
| SSO                 | No              | No            | No             | Yes        |
| SLA                 | None            | 99.5%         | 99.9%          | 99.95%     |
| Support             | Community       | Email         | Priority       | Dedicated  |

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│ BILLING FLOW                                             │
│                                                          │
│ Stripe Webhooks → Billing Service:                       │
│ ├── checkout.session.completed → Create subscription     │
│ ├── invoice.paid → Renew period, reset usage            │
│ ├── invoice.payment_failed → Mark past_due              │
│ ├── customer.subscription.deleted → Cancel              │
│ └── customer.subscription.updated → Plan change         │
│                                                          │
│ Usage Tracking (Redis + PostgreSQL):                     │
│ ├── Redis: INCR interview_count:{companyId}:{period}    │
│ ├── PostgreSQL: Monthly rollup via cron                  │
│ └── Quota check: API Gateway middleware                  │
│                                                          │
│ Quota Enforcement:                                       │
│ API Gateway → GET /billing/quota/{companyId}            │
│   → Redis check (< 1ms)                                 │
│   → If exceeded: 402 Payment Required                    │
│   → If approaching: X-Quota-Remaining header            │
└──────────────────────────────────────────────────────────┘
```

### Kafka Events

| Event                   | Topic          | Trigger                  | Consumer                   |
| ----------------------- | -------------- | ------------------------ | -------------------------- |
| `subscription.created`  | billing-events | Stripe checkout complete | Notification Service       |
| `subscription.canceled` | billing-events | Customer cancels         | Notification, User Service |
| `subscription.past_due` | billing-events | Payment failed           | Notification Service       |
| `quota.exceeded`        | billing-events | Usage > plan limit       | Notification Service       |
| `quota.approaching`     | billing-events | Usage > 80% of limit     | Notification Service       |

### Kafka Consumption

```
CONSUMER GROUP: billing-service

interview-events:
  invitation.completed → Increment interview usage counter

analysis-events:
  analysis.completed → Track token usage per company

user-events:
  user.created → Initialize usage record for new user's company

media-events:
  media.ready → Track storage usage per company
```

### Quota Enforcement Flow

```
Client request → API Gateway middleware:
  1. Extract companyId from JWT claims
  2. GET /billing/quota/{companyId} (cached in Redis, TTL 60s)
  3. Check: is operation within quota?
     - Creating interview? Check interviews_used < plan.interviewsPerMonth
     - Creating template? Check templates_created < plan.maxTemplates
     - Uploading video? Check storage_used < plan.maxStorageMB
  4. If within quota → proceed, set X-Quota-Remaining header
  5. If exceeded → 402 Payment Required with upgrade URL
```

### Database

```sql
-- ai_video_interview_billing

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'free',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usage_records (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  period VARCHAR(7) NOT NULL, -- YYYY-MM
  interviews_used INT NOT NULL DEFAULT 0,
  templates_created INT NOT NULL DEFAULT 0,
  analysis_tokens_used INT NOT NULL DEFAULT 0,
  storage_used_mb DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, period)
);

CREATE TABLE payment_events (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  stripe_event_id VARCHAR(100) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Service Dependency Map

```
                    ┌─────────────────┐
                    │   API Gateway   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────┴──────┐    ┌─────┴──────┐    ┌─────┴──────┐
    │   User     │    │ Interview  │    │ AI Analysis│
    │  Service   │    │  Service   │    │  Service   │
    └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
          │                  │                  │
          │           ┌──────┴──────┐           │
          │           │   Media     │           │
          │           │  Service    │           │
          │           └─────────────┘           │
          │                                     │
    ┌─────┴─────────────────────────────────────┴──────┐
    │              Notification Service                 │
    │     (consumes events from ALL services)           │
    └───────────────────────┬──────────────────────────┘
                            │
    ┌───────────────────────┴──────────────────────────┐
    │              Billing Service                      │
    │     (tracks usage from ALL services)             │
    └──────────────────────────────────────────────────┘
```

### New Kafka Topics

```
media-events / media-events-dlq        — Media Service lifecycle
notification-events / notification-events-dlq  — Delivery confirmations
billing-events / billing-events-dlq     — Subscription & quota events
```

---

_Created: 2026-03-27_
