# Interview Service

**Status:** ✅ Implemented
**Port:** 8003
**Technology Stack:** NestJS, TypeORM, PostgreSQL, Kafka, Redis (BullMQ)  
**Database:** `ai_video_interview_interview`

---

## Overview

Interview Service manages interview templates, questions, candidate invitations, and response collection for the AI Video Interview platform using Clean Architecture with CQRS and DDD patterns.

**Key Responsibilities:**

- Interview template management
- Question bank management
- Candidate invitation workflow
- Response collection and storage
- Interview status tracking
- Event publishing via OUTBOX pattern

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        INTERVIEW SERVICE (8003)                                 │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         HTTP Layer                                       │   │
│  │  ┌─────────────────────────┐      ┌─────────────────────────┐          │   │
│  │  │  Templates Controller   │      │ Invitations Controller  │          │   │
│  │  │  (CRUD + Questions)     │      │ (CRUD + Responses)      │          │   │
│  │  └─────────────────────────┘      └─────────────────────────┘          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                        │
│  ┌─────────────────────────────────────▼───────────────────────────────────┐   │
│  │                    Application Layer (CQRS)                              │   │
│  │                                                                          │   │
│  │  Commands:                              Queries:                         │   │
│  │  ┌──────────────────────────┐          ┌──────────────────────────┐    │   │
│  │  │ CreateTemplate           │          │ GetTemplate              │    │   │
│  │  │ UpdateTemplate           │          │ ListTemplates            │    │   │
│  │  │ DeleteTemplate           │          │ GetTemplateQuestions     │    │   │
│  │  │ PublishTemplate          │          │                          │    │   │
│  │  │ AddQuestion              │          │ GetInvitation            │    │   │
│  │  │ RemoveQuestion           │          │ ListHrInvitations        │    │   │
│  │  │ ReorderQuestions         │          │ ListCandidateInvitations │    │   │
│  │  │                          │          │                          │    │   │
│  │  │ CreateInvitation         │          │                          │    │   │
│  │  │ StartInvitation          │          │                          │    │   │
│  │  │ SubmitResponse           │          │                          │    │   │
│  │  │ CompleteInvitation       │          │                          │    │   │
│  │  └──────────────────────────┘          └──────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                        │
│  ┌─────────────────────────────────────▼───────────────────────────────────┐   │
│  │                         Domain Layer (DDD)                               │   │
│  │                                                                          │   │
│  │  Aggregates:                    Entities:           Value Objects:       │   │
│  │  ┌───────────────────────┐     ┌────────────┐      ┌────────────────┐   │   │
│  │  │ InterviewTemplate     │     │  Question  │      │ TemplateStatus │   │   │
│  │  │ (aggregate root)      │     │  Response  │      │InvitationStatus│   │   │
│  │  │                       │     │            │      │ QuestionType   │   │   │
│  │  │ Invitation            │     │            │      │ ResponseType   │   │   │
│  │  │ (aggregate root)      │     │            │      │InterviewSettings│  │   │
│  │  └───────────────────────┘     └────────────┘      └────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                        │
│  ┌─────────────────────────────────────▼───────────────────────────────────┐   │
│  │                      Infrastructure Layer                                │   │
│  │                                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │  Persistence │  │   Messaging  │  │    Kafka     │  │  Metrics   │  │   │
│  │  │  (TypeORM)   │  │(INBOX/OUTBOX)│  │  (Events)    │  │(Prometheus)│  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    PostgreSQL             Redis                Kafka
     (5432)               (6379)              (9092)
```

---

## Project Structure

```
src/
├── domain/                              # Domain Layer
│   ├── aggregates/
│   │   ├── interview-template.aggregate.ts  # Template aggregate root
│   │   └── invitation.aggregate.ts          # Invitation aggregate root
│   ├── entities/
│   │   ├── question.entity.ts               # Question entity
│   │   └── response.entity.ts               # Response entity
│   ├── value-objects/
│   │   ├── template-status.vo.ts            # draft/published/archived
│   │   ├── invitation-status.vo.ts          # pending/started/completed/expired
│   │   ├── question-type.vo.ts              # video/text/multiple_choice
│   │   ├── response-type.vo.ts              # video/text/choice
│   │   ├── question-option.vo.ts            # Multiple choice options
│   │   └── interview-settings.vo.ts         # Time limits, retakes
│   ├── events/
│   │   ├── template-created.event.ts
│   │   ├── template-published.event.ts
│   │   ├── invitation-created.event.ts
│   │   ├── invitation-started.event.ts
│   │   ├── response-submitted.event.ts
│   │   └── invitation-completed.event.ts
│   ├── repositories/
│   │   ├── template.repository.interface.ts
│   │   └── invitation.repository.interface.ts
│   ├── base/
│   │   ├── aggregate-root.ts
│   │   └── entity.ts
│   └── exceptions/
│       └── interview.exceptions.ts
│
├── application/                         # Application Layer (CQRS)
│   ├── commands/
│   │   ├── create-template/
│   │   │   ├── create-template.command.ts
│   │   │   └── create-template.handler.ts
│   │   ├── update-template/
│   │   ├── delete-template/
│   │   ├── publish-template/
│   │   ├── add-question/
│   │   ├── remove-question/
│   │   ├── reorder-questions/
│   │   ├── create-invitation/
│   │   ├── start-invitation/
│   │   ├── submit-response/
│   │   └── complete-invitation/
│   ├── queries/
│   │   ├── get-template/
│   │   ├── list-templates/
│   │   ├── get-template-questions/
│   │   ├── get-invitation/
│   │   ├── list-hr-invitations/
│   │   └── list-candidate-invitations/
│   ├── dto/
│   │   ├── requests/
│   │   └── responses/
│   └── application.module.ts
│
├── infrastructure/                      # Infrastructure Layer
│   ├── persistence/
│   │   ├── entities/
│   │   │   ├── interview-template.entity.ts
│   │   │   ├── question.entity.ts
│   │   │   ├── invitation.entity.ts
│   │   │   ├── response.entity.ts
│   │   │   └── outbox.entity.ts
│   │   ├── repositories/
│   │   │   ├── typeorm-template.repository.ts
│   │   │   └── typeorm-invitation.repository.ts
│   │   ├── mappers/
│   │   │   ├── template.mapper.ts
│   │   │   └── invitation.mapper.ts
│   │   ├── migrations/
│   │   ├── database.module.ts
│   │   └── typeorm.config.ts
│   │
│   ├── messaging/                      # OUTBOX Pattern
│   │   ├── outbox/
│   │   │   ├── outbox-publisher.processor.ts
│   │   │   └── outbox-scheduler.service.ts
│   │   └── messaging.module.ts
│   │
│   ├── kafka/
│   │   └── kafka.module.ts
│   │
│   ├── http/
│   │   ├── controllers/
│   │   │   ├── templates.controller.ts
│   │   │   ├── invitations.controller.ts
│   │   │   └── health.controller.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── modules/
│   │   │   ├── templates.module.ts
│   │   │   └── invitations.module.ts
│   │   └── http.module.ts
│   │
│   ├── logger/
│   │   └── logger.module.ts
│   │
│   └── metrics/
│       └── metrics.module.ts
│
├── app.module.ts
└── main.ts
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────┐
│ interview_templates │
├─────────────────────┤
│ id (PK)             │
│ title               │
│ description         │
│ owner_id            │◄───── HR user who created
│ company_id          │
│ status              │       draft/published/archived
│ settings (JSONB)    │       time limits, retakes
│ created_at          │
│ updated_at          │
└─────────┬───────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐
│     questions       │
├─────────────────────┤
│ id (PK)             │
│ template_id (FK)    │──────► interview_templates
│ text                │
│ type                │       video/text/multiple_choice
│ order               │
│ time_limit          │       seconds
│ is_required         │
│ options (JSONB)     │       for multiple choice
│ created_at          │
└─────────────────────┘

┌─────────────────────┐
│    invitations      │
├─────────────────────┤
│ id (PK)             │
│ template_id (FK)    │──────► interview_templates
│ candidate_id        │       User ID of candidate
│ candidate_email     │
│ candidate_name      │
│ hr_id               │       HR who invited
│ status              │       pending/started/completed/expired
│ access_token        │       Unique token for access
│ started_at          │
│ completed_at        │
│ expires_at          │
│ created_at          │
└─────────┬───────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐
│     responses       │
├─────────────────────┤
│ id (PK)             │
│ invitation_id (FK)  │──────► invitations
│ question_id (FK)    │──────► questions
│ type                │       video/text/choice
│ content             │       Text answer or choice
│ media_url           │       Video/audio URL
│ duration            │       Recording duration
│ submitted_at        │
│ created_at          │
└─────────────────────┘

┌─────────────────────┐
│       outbox        │
├─────────────────────┤
│ id (PK)             │
│ event_type          │
│ payload (JSONB)     │
│ status              │       pending/published/failed
│ published_at        │
│ created_at          │
└─────────────────────┘
```

### Tables Detail

**interview_templates**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | VARCHAR | Template title |
| `description` | TEXT | Template description |
| `owner_id` | UUID | HR user ID who created |
| `company_id` | UUID | Company ID (optional) |
| `status` | ENUM | draft, published, archived |
| `settings` | JSONB | Interview settings |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update |

**questions**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `template_id` | UUID | FK to interview_templates |
| `text` | TEXT | Question text |
| `type` | ENUM | video, text, multiple_choice |
| `order` | INTEGER | Question order |
| `time_limit` | INTEGER | Time limit in seconds |
| `is_required` | BOOLEAN | Required question flag |
| `options` | JSONB | Multiple choice options |

**invitations**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `template_id` | UUID | FK to interview_templates |
| `candidate_id` | UUID | Candidate user ID |
| `candidate_email` | VARCHAR | Candidate email |
| `candidate_name` | VARCHAR | Candidate name |
| `hr_id` | UUID | HR user ID |
| `status` | ENUM | pending, started, completed, expired |
| `access_token` | VARCHAR | Unique access token |
| `started_at` | TIMESTAMP | When candidate started |
| `completed_at` | TIMESTAMP | When completed |
| `expires_at` | TIMESTAMP | Invitation expiration |

**responses**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `invitation_id` | UUID | FK to invitations |
| `question_id` | UUID | FK to questions |
| `type` | ENUM | video, text, choice |
| `content` | TEXT | Text answer or selected option |
| `media_url` | TEXT | URL to video/audio in MinIO |
| `duration` | INTEGER | Recording duration (seconds) |
| `submitted_at` | TIMESTAMP | Submission timestamp |

---

## Value Objects

### TemplateStatus

- `draft` - Template being edited
- `published` - Available for invitations
- `archived` - No longer in use

### InvitationStatus

- `pending` - Invitation sent, not started
- `started` - Candidate started interview
- `completed` - All responses submitted
- `expired` - Deadline passed

### QuestionType

- `video` - Video response required
- `text` - Text response required
- `multiple_choice` - Select from options

### ResponseType

- `video` - Video recording
- `text` - Text answer
- `choice` - Selected option(s)

### InterviewSettings

```typescript
{
  totalTimeLimit: number; // Total interview time (minutes)
  questionTimeLimit: number; // Default per-question limit
  allowRetakes: boolean; // Can re-record video
  maxRetakes: number; // Max retake attempts
  shuffleQuestions: boolean; // Randomize order
  showProgress: boolean; // Show progress indicator
}
```

---

## CQRS Commands

### Template Commands

| Command                  | Description                 |
| ------------------------ | --------------------------- |
| `CreateTemplateCommand`  | Create new template (draft) |
| `UpdateTemplateCommand`  | Update template details     |
| `DeleteTemplateCommand`  | Delete template             |
| `PublishTemplateCommand` | Publish template for use    |
| `ArchiveTemplateCommand` | Archive template            |

### Question Commands

| Command                   | Description              |
| ------------------------- | ------------------------ |
| `AddQuestionCommand`      | Add question to template |
| `UpdateQuestionCommand`   | Update question          |
| `RemoveQuestionCommand`   | Remove question          |
| `ReorderQuestionsCommand` | Change question order    |

### Invitation Commands

| Command                     | Description                |
| --------------------------- | -------------------------- |
| `CreateInvitationCommand`   | Invite candidate           |
| `StartInvitationCommand`    | Candidate starts interview |
| `SubmitResponseCommand`     | Submit answer to question  |
| `CompleteInvitationCommand` | Complete the interview     |

---

## CQRS Queries

| Query                           | Description                  |
| ------------------------------- | ---------------------------- |
| `GetTemplateQuery`              | Get template by ID           |
| `ListTemplatesQuery`            | List HR's templates          |
| `GetTemplateQuestionsQuery`     | Get template questions       |
| `GetInvitationQuery`            | Get invitation by ID         |
| `ListHrInvitationsQuery`        | List HR's sent invitations   |
| `ListCandidateInvitationsQuery` | List candidate's invitations |

---

## API Endpoints

### Templates API

| Method   | Endpoint                        | Description          |
| -------- | ------------------------------- | -------------------- |
| `GET`    | `/api/v1/templates`             | List HR's templates  |
| `GET`    | `/api/v1/templates/:id`         | Get template details |
| `POST`   | `/api/v1/templates`             | Create template      |
| `PUT`    | `/api/v1/templates/:id`         | Update template      |
| `DELETE` | `/api/v1/templates/:id`         | Delete template      |
| `POST`   | `/api/v1/templates/:id/publish` | Publish template     |
| `POST`   | `/api/v1/templates/:id/archive` | Archive template     |

### Questions API

| Method   | Endpoint                                  | Description       |
| -------- | ----------------------------------------- | ----------------- |
| `GET`    | `/api/v1/templates/:id/questions`         | Get questions     |
| `POST`   | `/api/v1/templates/:id/questions`         | Add question      |
| `PUT`    | `/api/v1/templates/:id/questions/:qId`    | Update question   |
| `DELETE` | `/api/v1/templates/:id/questions/:qId`    | Remove question   |
| `PUT`    | `/api/v1/templates/:id/questions/reorder` | Reorder questions |

### Invitations API

| Method | Endpoint                            | Description             |
| ------ | ----------------------------------- | ----------------------- |
| `GET`  | `/api/v1/invitations`               | List HR's invitations   |
| `GET`  | `/api/v1/invitations/candidate`     | Candidate's invitations |
| `GET`  | `/api/v1/invitations/:id`           | Get invitation details  |
| `POST` | `/api/v1/invitations`               | Create invitation       |
| `POST` | `/api/v1/invitations/:id/start`     | Start interview         |
| `POST` | `/api/v1/invitations/:id/responses` | Submit response         |
| `POST` | `/api/v1/invitations/:id/complete`  | Complete interview      |

### Health

| Method | Endpoint        | Description     |
| ------ | --------------- | --------------- |
| `GET`  | `/health`       | Health check    |
| `GET`  | `/health/live`  | Liveness probe  |
| `GET`  | `/health/ready` | Readiness probe |

---

## Kafka Integration

### Published Events (via OUTBOX)

| Topic              | Event                  | Trigger             |
| ------------------ | ---------------------- | ------------------- |
| `interview-events` | `template.created`     | Template created    |
| `interview-events` | `template.published`   | Template published  |
| `interview-events` | `template.archived`    | Template archived   |
| `interview-events` | `invitation.created`   | Candidate invited   |
| `interview-events` | `invitation.started`   | Interview started   |
| `interview-events` | `response.submitted`   | Response submitted  |
| `interview-events` | `invitation.completed` | Interview completed |

### Event Schemas

**invitation.created**

```json
{
  "eventId": "uuid",
  "eventType": "invitation.created",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "invitationId": "uuid",
    "templateId": "uuid",
    "templateTitle": "Frontend Developer Interview",
    "candidateId": "uuid",
    "candidateEmail": "candidate@example.com",
    "candidateName": "John Doe",
    "hrId": "uuid",
    "expiresAt": "2025-01-08T00:00:00Z"
  }
}
```

**invitation.completed**

```json
{
  "eventId": "uuid",
  "eventType": "invitation.completed",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "invitationId": "uuid",
    "templateId": "uuid",
    "candidateId": "uuid",
    "hrId": "uuid",
    "responsesCount": 5,
    "duration": 1800,
    "completedAt": "2025-01-01T00:00:00Z"
  }
}
```

**response.submitted**

```json
{
  "eventId": "uuid",
  "eventType": "response.submitted",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "responseId": "uuid",
    "invitationId": "uuid",
    "questionId": "uuid",
    "type": "video",
    "mediaUrl": "s3://videos/...",
    "duration": 120
  }
}
```

---

## Interview Flow

### Complete Interview Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Interview Flow                                          │
│                                                                                 │
│  1. HR creates template with questions                                          │
│     POST /api/v1/templates                                                     │
│     POST /api/v1/templates/:id/questions (repeat for each question)           │
│     │                                                                          │
│     ▼                                                                          │
│  2. HR publishes template                                                       │
│     POST /api/v1/templates/:id/publish                                         │
│     → Event: template.published                                                │
│     │                                                                          │
│     ▼                                                                          │
│  3. HR invites candidate                                                        │
│     POST /api/v1/invitations                                                   │
│     { templateId, candidateEmail, candidateName, expiresAt }                   │
│     → Event: invitation.created                                                │
│     → Notification Service sends email                                         │
│     │                                                                          │
│     ▼                                                                          │
│  4. Candidate receives email with unique link                                  │
│     https://app.com/interview/{accessToken}                                    │
│     │                                                                          │
│     ▼                                                                          │
│  5. Candidate starts interview                                                  │
│     POST /api/v1/invitations/:id/start                                         │
│     → Status: pending → started                                                │
│     → Event: invitation.started                                                │
│     │                                                                          │
│     ▼                                                                          │
│  6. Candidate answers each question                                            │
│     POST /api/v1/invitations/:id/responses                                     │
│     { questionId, type: "video", mediaUrl: "..." }                             │
│     → Event: response.submitted (triggers Media Service processing)           │
│     │                                                                          │
│     ▼                                                                          │
│  7. Candidate completes interview                                              │
│     POST /api/v1/invitations/:id/complete                                      │
│     → Status: started → completed                                              │
│     → Event: invitation.completed                                              │
│     → AI Analysis Service starts processing                                    │
│     │                                                                          │
│     ▼                                                                          │
│  8. HR receives notification: analysis ready                                   │
│     HR views results in dashboard                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables

```bash
# Application
PORT=8003
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ai_video_interview_interview
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=interview-service
KAFKA_GROUP_ID=interview-service-group

# Frontend URL (for invitation links)
FRONTEND_URL=http://localhost:3000

# Invitation settings
INVITATION_DEFAULT_EXPIRY_DAYS=7

# Observability
LOG_LEVEL=debug
LOKI_HOST=http://localhost:3100
```

---

## Metrics

### Prometheus Metrics

```
interview_templates_total{status="draft|published|archived"}
interview_invitations_total{status="pending|started|completed|expired"}
interview_responses_total{type="video|text|choice"}
interview_commands_total{command="create_template|create_invitation|..."}
interview_queries_total{query="get_template|list_invitations|..."}
interview_outbox_events_total{status="pending|published|failed"}
interview_completion_duration_seconds
```

---

## Error Handling

### Domain Exceptions

| Exception                           | HTTP Code | Description                            |
| ----------------------------------- | --------- | -------------------------------------- |
| `TemplateNotFoundException`         | 404       | Template not found                     |
| `TemplateNotPublishedException`     | 400       | Cannot invite for unpublished template |
| `InvitationNotFoundException`       | 404       | Invitation not found                   |
| `InvitationExpiredException`        | 400       | Invitation has expired                 |
| `InvitationAlreadyStartedException` | 400       | Interview already started              |
| `InvitationNotStartedException`     | 400       | Must start before submitting           |
| `QuestionNotFoundException`         | 404       | Question not found                     |
| `ResponseAlreadySubmittedException` | 400       | Already answered this question         |

---

## Development

### Running Locally

```bash
# Start dependencies
docker-compose up -d postgres redis kafka

# Run migrations
npm run migration:run --filter=interview-service

# Start service
npm run dev --filter=interview-service

# Service available at http://localhost:8003
```

### Testing

```bash
# Unit tests
npm run test --filter=interview-service

# E2E tests
npm run test:e2e --filter=interview-service
```

### Migrations

```bash
# Generate new migration
npm run migration:generate --filter=interview-service -- -n MigrationName

# Run migrations
npm run migration:run --filter=interview-service

# Revert last migration
npm run migration:revert --filter=interview-service
```

---

**Last Updated:** December 2024
