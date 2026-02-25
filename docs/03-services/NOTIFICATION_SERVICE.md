# Notification Service

**Status:** 🔴 Not Implemented  
**Port:** 3008  
**Technology Stack:** NestJS, TypeORM, PostgreSQL, Resend/SendGrid, Redis (BullMQ)  
**Priority:** MEDIUM (Required for candidate invitations)

---

## Overview

Notification Service handles all outbound communications for the AI Video Interview platform including emails, webhooks, and future push notifications.

**Key Capabilities:**
- Transactional email delivery (Resend/SendGrid)
- Email template management
- Delivery tracking and retry logic
- Webhook integrations (ATS systems)
- Notification preferences

---

## Notification Types

### Email Notifications

| Category | Trigger | Template | Priority |
|----------|---------|----------|----------|
| **Registration** | User signup | `welcome` | High |
| **Interview** | Candidate invited | `interview_invitation` | High |
| **Interview** | Interview reminder (24h) | `interview_reminder` | Medium |
| **Interview** | Interview completed | `interview_completed` | Medium |
| **Analysis** | Analysis ready | `analysis_ready` | Medium |
| **Candidate** | Candidate approved | `candidate_approved` | High |
| **Candidate** | Candidate rejected | `candidate_rejected` | High |
| **Billing** | Subscription confirmed | `subscription_confirmed` | High |
| **Billing** | Payment successful | `payment_successful` | Low |
| **Billing** | Payment failed | `payment_failed` | Critical |
| **Billing** | Trial ending | `trial_ending` | High |
| **Security** | Password reset | `password_reset` | Critical |
| **Security** | New login detected | `new_login` | Medium |

### Webhook Notifications

| Event | Payload | Use Case |
|-------|---------|----------|
| `interview.completed` | Interview + candidate data | ATS integration |
| `analysis.ready` | Scores + feedback | Automated workflows |
| `candidate.status_changed` | Status update | External systems |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 NOTIFICATION SERVICE (3008)                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │               Kafka Consumer Layer                         │ │
│  │  - user-events                                             │ │
│  │  - interview-events                                        │ │
│  │  - analysis-events                                         │ │
│  │  - billing-events                                          │ │
│  └───────────────────────────┬───────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │              Application Layer (CQRS)                      │ │
│  │  Commands:                    Queries:                     │ │
│  │  - SendEmail                  - GetNotification            │ │
│  │  - SendWebhook                - ListNotifications          │ │
│  │  - RetryNotification          - GetDeliveryStatus          │ │
│  │  - UpdatePreferences          - GetUserPreferences         │ │
│  └───────────────────────────┬───────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │              Template Engine                               │ │
│  │  - Handlebars templates                                    │ │
│  │  - i18n support (en, ru, de, es)                          │ │
│  │  - Variable interpolation                                  │ │
│  └───────────────────────────┬───────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │              Delivery Layer                                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │   Resend    │  │   Webhook   │  │    Push     │       │ │
│  │  │   Provider  │  │   Sender    │  │   (Future)  │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    PostgreSQL      Resend API       Redis         Kafka
   (logs/prefs)      (email)        (queue)      (events)
```

---

## Email Templates

### Template Structure

```
templates/
├── layouts/
│   ├── base.hbs              # Base HTML layout
│   └── plain.hbs             # Plain text layout
│
├── partials/
│   ├── header.hbs
│   ├── footer.hbs
│   ├── button.hbs
│   └── social-links.hbs
│
├── emails/
│   ├── welcome/
│   │   ├── subject.hbs
│   │   ├── html.hbs
│   │   └── text.hbs
│   │
│   ├── interview_invitation/
│   │   ├── subject.hbs
│   │   ├── html.hbs
│   │   └── text.hbs
│   │
│   ├── candidate_approved/
│   │   ├── subject.hbs
│   │   ├── html.hbs
│   │   └── text.hbs
│   │
│   └── ... (other templates)
│
└── i18n/
    ├── en.json
    ├── ru.json
    └── de.json
```

### Example Template: Interview Invitation

**Subject (subject.hbs):**
```handlebars
You've been invited to interview at {{companyName}}
```

**HTML (html.hbs):**
```handlebars
{{#extend "layouts/base"}}
  {{#content "body"}}
    <h1>Hello {{candidateName}},</h1>
    
    <p>
      <strong>{{hrName}}</strong> from <strong>{{companyName}}</strong> 
      has invited you to complete a video interview for the 
      <strong>{{positionTitle}}</strong> position.
    </p>
    
    <div class="interview-details">
      <p><strong>Interview:</strong> {{interviewTitle}}</p>
      <p><strong>Questions:</strong> {{questionCount}}</p>
      <p><strong>Time Limit:</strong> {{totalTimeLimit}} minutes</p>
      {{#if deadline}}
        <p><strong>Deadline:</strong> {{formatDate deadline "MMMM D, YYYY"}}</p>
      {{/if}}
    </div>
    
    {{> button 
        text="Start Interview" 
        url=interviewUrl 
        color="primary"
    }}
    
    <p class="note">
      This link is unique to you and will expire {{#if deadline}}on {{formatDate deadline}}{{else}}in 7 days{{/if}}.
    </p>
    
    <p>
      Good luck!<br>
      The {{companyName}} Team
    </p>
  {{/content}}
{{/extend}}
```

### Template Variables

```typescript
interface InterviewInvitationData {
  // Candidate
  candidateName: string;
  candidateEmail: string;
  
  // Company
  companyName: string;
  companyLogo?: string;
  
  // HR
  hrName: string;
  hrEmail: string;
  
  // Interview
  interviewId: string;
  interviewTitle: string;
  positionTitle: string;
  questionCount: number;
  totalTimeLimit: number;  // minutes
  deadline?: Date;
  
  // Links
  interviewUrl: string;  // Public interview link
  
  // Branding (Pro plan)
  primaryColor?: string;
  logoUrl?: string;
}
```

---

## Kafka Integration

### Subscribed Topics

| Topic | Event | Template | Recipient |
|-------|-------|----------|-----------|
| `user-events` | `user.created` | `welcome` | User |
| `interview-events` | `invitation.created` | `interview_invitation` | Candidate |
| `interview-events` | `interview.completed` | `interview_completed` | HR |
| `analysis-events` | `analysis.completed` | `analysis_ready` | HR |
| `billing-events` | `subscription.created` | `subscription_confirmed` | User |
| `billing-events` | `payment.failed` | `payment_failed` | User |

### Event Processing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  Event Processing Flow                          │
│                                                                 │
│  1. Kafka event received                                       │
│     │                                                          │
│     ▼                                                          │
│  2. Event handler maps to notification type                    │
│     {                                                          │
│       eventType: "invitation.created",                         │
│       template: "interview_invitation",                        │
│       recipient: event.data.candidateEmail                     │
│     }                                                          │
│     │                                                          │
│     ▼                                                          │
│  3. Check user notification preferences                        │
│     - Is this notification type enabled?                       │
│     - Preferred language?                                      │
│     │                                                          │
│     ▼                                                          │
│  4. Queue notification job (BullMQ)                           │
│     {                                                          │
│       type: "email",                                           │
│       template: "interview_invitation",                        │
│       recipient: "candidate@email.com",                        │
│       data: {...},                                             │
│       priority: "high"                                         │
│     }                                                          │
│     │                                                          │
│     ▼                                                          │
│  5. Worker processes job                                       │
│     - Render template with data                                │
│     - Send via Resend API                                      │
│     - Log delivery status                                      │
│     │                                                          │
│     ▼                                                          │
│  6. On failure: retry with exponential backoff                 │
│     - Max 3 attempts                                           │
│     - Alert on permanent failure                               │
└─────────────────────────────────────────────────────────────────┘
```

### Published Events

| Topic | Event | Trigger |
|-------|-------|---------|
| `notification-events` | `email.sent` | Email delivered |
| `notification-events` | `email.failed` | Delivery failed |
| `notification-events` | `webhook.sent` | Webhook delivered |

---

## Email Provider (Resend)

### Configuration

```yaml
resend:
  api_key: ${RESEND_API_KEY}
  from_email: noreply@yourdomain.com
  from_name: AI Video Interview
  reply_to: support@yourdomain.com
  
  # Domain verification required
  domain: yourdomain.com
  
  # Rate limits (Resend free tier)
  rate_limit:
    emails_per_day: 100
    emails_per_second: 2
```

### API Usage

```typescript
// Send email via Resend
const response = await resend.emails.send({
  from: 'AI Video Interview <noreply@yourdomain.com>',
  to: ['candidate@email.com'],
  subject: 'You\'ve been invited to interview at TechCorp',
  html: renderedHtml,
  text: renderedText,
  tags: [
    { name: 'template', value: 'interview_invitation' },
    { name: 'interview_id', value: 'uuid' }
  ]
});

// response.id = "email_xxxxx" (for tracking)
```

### Delivery Tracking

```
Resend provides webhook callbacks for:
- email.sent
- email.delivered
- email.opened
- email.clicked
- email.bounced
- email.complained

Configure webhook URL: /api/v1/webhooks/resend
```

---

## Webhook Integration

### Webhook Configuration (Per Organization)

```json
{
  "webhookId": "uuid",
  "organizationId": "uuid",
  "url": "https://ats.company.com/webhooks/ai-interview",
  "secret": "whsec_xxxxxxxxxxxxx",
  "events": [
    "interview.completed",
    "analysis.ready",
    "candidate.status_changed"
  ],
  "headers": {
    "X-Custom-Header": "value"
  },
  "isActive": true
}
```

### Webhook Payload Structure

```json
{
  "id": "evt_xxxxxxxxxxxx",
  "type": "interview.completed",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "interviewId": "uuid",
    "candidateId": "uuid",
    "candidateName": "John Doe",
    "candidateEmail": "john@example.com",
    "positionTitle": "Frontend Developer",
    "completedAt": "2025-01-01T00:00:00Z",
    "status": "completed"
  }
}
```

### Webhook Signature Verification

```
X-Webhook-Signature: sha256=xxxxxxxxxxxx

Signature = HMAC-SHA256(
  secret,
  timestamp + "." + JSON.stringify(payload)
)
```

---

## Database Schema

### Tables

**notifications**
```
┌─────────────────────────────────────────────────────────────────┐
│ notifications                                                   │
├─────────────────────────────────────────────────────────────────┤
│ id                      UUID PRIMARY KEY                        │
│ type                    ENUM('email','webhook','push')          │
│ template                VARCHAR(100)                            │
│ recipient               VARCHAR(255) NOT NULL                   │
│ recipient_user_id       UUID (FK → users, nullable)             │
│ subject                 VARCHAR(500)                            │
│ content_preview         TEXT                                    │
│ data                    JSONB (template variables)              │
│ status                  ENUM('pending','sent','delivered',      │
│                              'failed','bounced')                │
│ provider_id             VARCHAR(255) (Resend email ID)          │
│ provider_response       JSONB                                   │
│ error_message           TEXT                                    │
│ retry_count             INTEGER DEFAULT 0                       │
│ sent_at                 TIMESTAMP                               │
│ delivered_at            TIMESTAMP                               │
│ opened_at               TIMESTAMP                               │
│ clicked_at              TIMESTAMP                               │
│ created_at              TIMESTAMP                               │
│ updated_at              TIMESTAMP                               │
└─────────────────────────────────────────────────────────────────┘
```

**notification_preferences**
```
┌─────────────────────────────────────────────────────────────────┐
│ notification_preferences                                        │
├─────────────────────────────────────────────────────────────────┤
│ id                      UUID PRIMARY KEY                        │
│ user_id                 UUID NOT NULL UNIQUE (FK → users)       │
│ email_enabled           BOOLEAN DEFAULT TRUE                    │
│ preferences             JSONB                                   │
│   - interview_invitation: true                                  │
│   - interview_reminder: true                                    │
│   - analysis_ready: true                                        │
│   - marketing: false                                            │
│ language                VARCHAR(5) DEFAULT 'en'                 │
│ timezone                VARCHAR(50)                             │
│ quiet_hours_start       TIME                                    │
│ quiet_hours_end         TIME                                    │
│ created_at              TIMESTAMP                               │
│ updated_at              TIMESTAMP                               │
└─────────────────────────────────────────────────────────────────┘
```

**webhooks**
```
┌─────────────────────────────────────────────────────────────────┐
│ webhooks                                                        │
├─────────────────────────────────────────────────────────────────┤
│ id                      UUID PRIMARY KEY                        │
│ organization_id         UUID NOT NULL                           │
│ url                     TEXT NOT NULL                           │
│ secret                  VARCHAR(255) NOT NULL                   │
│ events                  TEXT[] NOT NULL                         │
│ headers                 JSONB                                   │
│ is_active               BOOLEAN DEFAULT TRUE                    │
│ last_triggered_at       TIMESTAMP                               │
│ failure_count           INTEGER DEFAULT 0                       │
│ created_at              TIMESTAMP                               │
│ updated_at              TIMESTAMP                               │
└─────────────────────────────────────────────────────────────────┘
```

**webhook_deliveries**
```
┌─────────────────────────────────────────────────────────────────┐
│ webhook_deliveries                                              │
├─────────────────────────────────────────────────────────────────┤
│ id                      UUID PRIMARY KEY                        │
│ webhook_id              UUID NOT NULL (FK → webhooks)           │
│ event_type              VARCHAR(100) NOT NULL                   │
│ payload                 JSONB NOT NULL                          │
│ status                  ENUM('pending','sent','failed')         │
│ response_status         INTEGER                                 │
│ response_body           TEXT                                    │
│ response_time_ms        INTEGER                                 │
│ retry_count             INTEGER DEFAULT 0                       │
│ sent_at                 TIMESTAMP                               │
│ created_at              TIMESTAMP                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/notifications` | List user's notifications |
| `GET` | `/api/v1/notifications/:id` | Get notification details |
| `POST` | `/api/v1/notifications/:id/retry` | Retry failed notification |

### Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/preferences` | Get notification preferences |
| `PUT` | `/api/v1/preferences` | Update preferences |
| `POST` | `/api/v1/preferences/unsubscribe` | Unsubscribe from type |

### Webhooks (Pro Plan)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/webhooks` | List organization webhooks |
| `POST` | `/api/v1/webhooks` | Create webhook |
| `PUT` | `/api/v1/webhooks/:id` | Update webhook |
| `DELETE` | `/api/v1/webhooks/:id` | Delete webhook |
| `GET` | `/api/v1/webhooks/:id/deliveries` | List delivery history |
| `POST` | `/api/v1/webhooks/:id/test` | Send test webhook |

### Provider Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/webhooks/resend` | Resend delivery callbacks |

### Internal

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/internal/send` | Send notification (service-to-service) |

---

## Processing Queue (BullMQ)

### Queue Configuration

```yaml
queues:
  email:
    concurrency: 5
    limiter:
      max: 2
      duration: 1000  # 2 emails/second (Resend limit)
    defaultJobOptions:
      attempts: 3
      backoff:
        type: exponential
        delay: 60000  # 1 min, 2 min, 4 min
      removeOnComplete: 1000
      
  webhook:
    concurrency: 10
    defaultJobOptions:
      attempts: 5
      backoff:
        type: exponential
        delay: 30000
      timeout: 30000
```

### Job Priority

| Priority | Level | Examples |
|----------|-------|----------|
| Critical | 1 | Password reset, payment failed |
| High | 2 | Interview invitation, candidate decision |
| Medium | 3 | Reminders, analysis ready |
| Low | 4 | Payment receipts, marketing |

---

## Configuration

### Environment Variables

```bash
# Application
PORT=3008
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ai_video_interview_notification
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Resend (Email Provider)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=AI Video Interview
EMAIL_REPLY_TO=support@yourdomain.com

# Alternative: SendGrid
# SENDGRID_API_KEY=SG.xxxxxxxxxxxx

# Templates
TEMPLATES_PATH=./templates
DEFAULT_LANGUAGE=en

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=notification-service
KAFKA_GROUP_ID=notification-service-group

# Webhook
WEBHOOK_TIMEOUT_MS=30000
WEBHOOK_MAX_RETRIES=5

# Frontend URLs (for email links)
FRONTEND_URL=http://localhost:3000
INTERVIEW_BASE_URL=http://localhost:3100

# Observability
LOG_LEVEL=debug
LOKI_HOST=http://localhost:3100
```

---

## Metrics & Monitoring

### Prometheus Metrics

```
notification_emails_sent_total{template="welcome|interview_invitation|...",status="sent|failed"}
notification_emails_delivery_duration_seconds
notification_emails_open_rate{template="..."}
notification_webhooks_sent_total{event="interview.completed|...",status="sent|failed"}
notification_webhooks_response_time_seconds
notification_queue_size{queue="email|webhook"}
notification_retry_total{type="email|webhook"}
```

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| EmailDeliveryFailure | >10% failure in 1h | Warning |
| WebhookEndpointDown | >5 consecutive failures | Warning |
| QueueBacklog | >1000 pending jobs | Critical |
| BounceRateHigh | >5% bounces | Warning |

---

## Security

### Email Security

```
- SPF record configured
- DKIM signing via Resend
- DMARC policy enabled
- Unsubscribe headers (RFC 8058)
- Rate limiting per recipient
```

### Webhook Security

```
- HMAC-SHA256 signature verification
- TLS/HTTPS required
- Secret rotation support
- IP allowlist (optional)
- Payload encryption (future)
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] NestJS project setup
- [ ] Database schema + migrations
- [ ] Resend integration
- [ ] Basic email sending

### Phase 2: Templates
- [ ] Handlebars template engine
- [ ] Core email templates
- [ ] i18n support
- [ ] Template preview/test API

### Phase 3: Event Integration
- [ ] Kafka consumers
- [ ] Event-to-notification mapping
- [ ] BullMQ queue processing
- [ ] Retry logic

### Phase 4: Webhooks
- [ ] Webhook management API
- [ ] Delivery system
- [ ] Signature verification
- [ ] Delivery logs

### Phase 5: Production
- [ ] Delivery tracking (opens, clicks)
- [ ] Notification preferences
- [ ] Metrics & monitoring
- [ ] Unsubscribe handling

---

**Last Updated:** 2025-01-XX
