# AI Analysis Service

**Status:** ✅ Implemented
**Port:** 8005
**Technology Stack:** NestJS 11, TypeORM, PostgreSQL, Groq API, Kafka
**Database:** `ai_video_interview_analysis`

---

## Overview

AI Analysis Service analyzes candidate interview responses using LLM-based evaluation via the Groq Cloud API. When a candidate completes an interview, the service automatically receives the event via Kafka, evaluates each response against 4 criteria, and produces an overall score with a hiring recommendation.

**Key Capabilities:**
- Per-question analysis via Groq LLM (configurable model, default: `openai/gpt-oss-120b`)
- Scoring on 4 criteria: relevance, completeness, clarity, depth (0-100)
- Overall interview score with hiring recommendation (hire / consider / reject)
- Fully event-driven: consumes `interview-events`, publishes `analysis-events`
- Idempotent processing via `processed_events` table

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   AI ANALYSIS SERVICE (8005)                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      DOMAIN LAYER                         │   │
│  │  ┌──────────────┐  ┌────────────────┐                    │   │
│  │  │AnalysisResult│  │QuestionAnalysis│                    │   │
│  │  │  (Aggregate)  │  │   (Entity)     │                    │   │
│  │  └──────────────┘  └────────────────┘                    │   │
│  │                                                           │   │
│  │  Value Objects: Score, Recommendation, AnalysisStatus,    │   │
│  │                 AnalysisMetadata, CriteriaScore            │   │
│  │  Events: AnalysisStarted, AnalysisCompleted, Failed       │   │
│  │  Repository Interfaces: IAnalysisResultRepository         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │                   APPLICATION LAYER                       │   │
│  │                                                           │   │
│  │  Ports (interfaces):                                      │   │
│  │  ├── IAnalysisEngine     → LLM abstraction (Groq)        │   │
│  │  ├── IEventPublisher     → Kafka event publishing         │   │
│  │  └── IPromptLoader       → Prompt templates & criteria    │   │
│  │                                                           │   │
│  │  Commands:                  Queries:                      │   │
│  │  ├── AnalyzeInterview      ├── GetAnalysisResult          │   │
│  │  └── RetryAnalysis         ├── GetAnalysisByInvitation    │   │
│  │                             └── ListAnalyses              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │                  INFRASTRUCTURE LAYER                      │   │
│  │                                                           │   │
│  │  Groq:              Persistence:          Kafka:          │   │
│  │  ├── GroqClient     ├── TypeORM entities  ├── Consumer    │   │
│  │  ├── RateLimiter    ├── Repositories      └── Publisher   │   │
│  │  └── PromptLoader   ├── Mappers                           │   │
│  │                     └── Migrations                        │   │
│  │                                                           │   │
│  │  HTTP:              Logger:                               │   │
│  │  ├── Analysis Ctrl  └── Winston + Loki                    │   │
│  │  ├── Sandbox Ctrl                                         │   │
│  │  └── Health Ctrl                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    PostgreSQL             Kafka              Groq Cloud API
```

---

## Domain Layer

### AnalysisResult (Aggregate Root)

State machine: `pending → in_progress → completed | failed`

```typescript
class AnalysisResult {
  id: string;                          // UUID
  invitationId: string;                // Reference to invitation (interview-service)
  status: AnalysisStatus;              // pending | in_progress | completed | failed

  // Results
  overallScore: Score;                 // 0-100, average of question scores
  summary: string;                     // 2-3 sentence summary
  strengths: string[];                 // Key strengths
  weaknesses: string[];                // Areas for improvement
  recommendation: Recommendation;      // hire | consider | reject

  // Metadata
  metadata: AnalysisMetadata;         // model, tokens, processingTime, language

  // Child entities
  questionAnalyses: QuestionAnalysis[];

  // Factory methods
  static create(invitationId: string): AnalysisResult;    // Emits domain event
  static reconstitute(props: Props): AnalysisResult;      // From persistence

  // Lifecycle methods
  start(): void;                       // pending → in_progress
  addQuestionAnalysis(qa: QuestionAnalysis): void;
  complete(data: CompletionData): void; // in_progress → completed
  fail(error: string): void;           // in_progress → failed
}
```

**Recommendation logic:**
- `hire` — overall score ≥ 75 AND no critical weaknesses
- `consider` — overall score 50-74 OR concerns noted
- `reject` — overall score < 50 OR red flags

### QuestionAnalysis (Entity)

```typescript
class QuestionAnalysis {
  id: string;
  questionId: string;                  // Reference to question
  questionText: string;                // Denormalized for display
  responseText: string;                // Candidate's answer

  score: Score;                        // 0-100
  feedback: string;                    // LLM-generated feedback
  criteriaScores: CriteriaScore[];     // Per-criteria breakdown
}
```

### Value Objects

| Value Object | Description |
|-------------|-------------|
| `Score` | Integer 0-100 with validation |
| `Recommendation` | Enum: `hire`, `consider`, `reject` |
| `AnalysisStatus` | Enum: `pending`, `in_progress`, `completed`, `failed` |
| `AnalysisMetadata` | `modelUsed`, `totalTokensUsed`, `processingTimeMs`, `language` |
| `CriteriaScore` | `{ criterion: string, score: Score, weight: number }` |

### Domain Events

| Event | When | Payload |
|-------|------|---------|
| `AnalysisStartedEvent` | Analysis begins | analysisId, invitationId |
| `AnalysisCompletedEvent` | Analysis succeeds | analysisId, invitationId, overallScore, recommendation |
| `AnalysisFailedEvent` | Analysis fails | analysisId, invitationId, error |

---

## Application Layer (CQRS)

### Ports (Interfaces)

```typescript
// Abstracts LLM provider (Groq in our case)
interface IAnalysisEngine {
  analyzeResponse(input: QuestionAnalysisInput): Promise<QuestionAnalysisResult>;
  generateSummary(analyses: QuestionAnalysis[]): Promise<SummaryResult>;
}

// Abstracts event publishing
interface IEventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

// Abstracts prompt template loading
interface IPromptLoader {
  getSystemPrompt(): string;
  getQuestionPrompt(type: string): string;
  getSummaryPrompt(): string;
  getCriteria(): CriterionConfig[];
}
```

### Commands

| Command | Handler | Description |
|---------|---------|-------------|
| `AnalyzeInterviewCommand` | `AnalyzeInterviewHandler` | Main workflow: receives event data, analyzes each question via LLM, generates summary |
| `RetryAnalysisCommand` | `RetryAnalysisHandler` | Retries a failed analysis |

**AnalyzeInterview workflow:**
1. Create `AnalysisResult` in `pending` status
2. Transition to `in_progress`
3. For each question-response pair (sequentially, with 5s rate limit):
   - Call `IAnalysisEngine.analyzeResponse()` → score, feedback, criteriaScores
   - Add `QuestionAnalysis` to aggregate
4. Call `IAnalysisEngine.generateSummary()` → summary, strengths, weaknesses, recommendation
5. Complete analysis, persist, publish `AnalysisCompletedEvent`
6. On error: mark as `failed`, publish `AnalysisFailedEvent`

### Queries

| Query | Handler | Description |
|-------|---------|-------------|
| `GetAnalysisResultQuery` | `GetAnalysisResultHandler` | Get analysis by ID |
| `GetAnalysisByInvitationQuery` | `GetAnalysisByInvitationHandler` | Get analysis by invitation ID |
| `ListAnalysesQuery` | `ListAnalysesHandler` | Paginated list of analyses |

---

## Infrastructure Layer

### Groq Integration

**Configuration:**

| Setting | Value | Notes |
|---------|-------|-------|
| Model | `openai/gpt-oss-120b` | Configurable via `GROQ_MODEL` env var |
| Temperature | 0.3 | Low for deterministic scoring |
| Response format | JSON mode | Structured output parsing |
| Rate limit | 5s delay between calls | Groq free tier: ~8000 TPM |
| Max retries | 3 | Exponential backoff on 429 |

**GroqAnalysisEngine** implements `IAnalysisEngine`:
- Constructs prompts per question type (text, multiple choice)
- Parses JSON responses with validation
- Handles rate limiting with configurable delay
- Supports chunked summaries for interviews with 30+ questions

### Scoring Criteria

Each question is evaluated on 4 criteria with equal weight:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Relevance** | 0.25 | How well the answer addresses the question |
| **Completeness** | 0.25 | How thoroughly the topic is covered |
| **Clarity** | 0.25 | How clearly the answer is articulated |
| **Depth** | 0.25 | How deep the candidate's understanding is |

### Kafka Integration

**Consumer:**

| Topic | Event | Action |
|-------|-------|--------|
| `interview-events` | `invitation.completed` | Triggers `AnalyzeInterviewCommand` |

The `invitation.completed` event contains **all data** needed for analysis:
- Questions (text, type, options)
- Responses (text answers, selected options)
- Template metadata (title, company name)

No HTTP calls to Interview Service needed — fully event-driven.

**Publisher:**

| Topic | Event | Trigger |
|-------|-------|---------|
| `analysis-events` | `analysis.completed` | After successful LLM evaluation |
| `analysis-events` | `analysis.failed` | On processing error |

**Idempotency:**
- `processed_events` table tracks consumed event IDs (UNIQUE constraint)
- Duplicate events are silently skipped
- Prevents re-analysis on Kafka rebalances

### Database Schema

**analysis_results**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Analysis ID |
| `invitation_id` | UUID UNIQUE | Reference to invitation |
| `status` | VARCHAR(20) | pending / in_progress / completed / failed |
| `overall_score` | INTEGER | 0-100 |
| `summary` | TEXT | LLM-generated summary |
| `strengths` | JSONB | Array of strengths |
| `weaknesses` | JSONB | Array of weaknesses |
| `recommendation` | VARCHAR(20) | hire / consider / reject |
| `model_used` | VARCHAR(100) | LLM model identifier |
| `tokens_used` | INTEGER | Total tokens consumed |
| `processing_time_ms` | INTEGER | Total processing time |
| `error_message` | TEXT | Error details (if failed) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**question_analyses**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Question analysis ID |
| `analysis_result_id` | UUID FK | Reference to analysis_results |
| `question_id` | UUID | Reference to question |
| `question_text` | TEXT | Denormalized question text |
| `question_type` | VARCHAR(20) | text / multiple_choice |
| `response_text` | TEXT | Candidate's answer |
| `score` | INTEGER | 0-100 |
| `feedback` | TEXT | LLM-generated feedback |
| `criteria_scores` | JSONB | Per-criteria scores array |
| `created_at` | TIMESTAMP | Creation timestamp |

**processed_events**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Record ID |
| `event_id` | VARCHAR UNIQUE | Kafka event ID (idempotency key) |
| `event_type` | VARCHAR | Event type |
| `processed_at` | TIMESTAMP | When event was processed |

### HTTP API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/analysis/:id` | Get analysis by ID | JWT |
| `GET` | `/api/v1/analysis/invitation/:invitationId` | Get analysis by invitation | JWT |
| `GET` | `/api/v1/analysis` | List analyses (paginated) | JWT, HR/Admin |
| `POST` | `/api/v1/analysis/invitation/:invitationId/retry` | Retry failed analysis | JWT, HR/Admin |

**Sandbox endpoint** (development only):
| `POST` | `/api/v1/sandbox/analyze` | Manually trigger analysis | — |

---

## Processing Flow

```
┌──────────────────┐
│ Interview Service│
│   completes      │
│   invitation     │
└────────┬─────────┘
         │
         ▼ Kafka: invitation.completed
           {
             invitationId,
             questions: [...],
             responses: [...]   ◄── ALL data in event payload
           }
┌──────────────────┐
│  AI Analysis     │
│  Consumer        │
│  (idempotency    │
│   check via      │
│   processed_     │
│   events table)  │
└────────┬─────────┘
         │
         ▼ AnalyzeInterviewCommand(eventData)
┌──────────────────┐
│  Handler:        │
│  1. Create       │
│     analysis     │
│  2. Start        │
└────────┬─────────┘
         │
         ▼ For each question (sequential, 5s delay)
┌──────────────────┐
│  Groq LLM:       │
│  - JSON mode     │
│  - 4 criteria    │
│  - Score 0-100   │
│  - Feedback      │
└────────┬─────────┘
         │
         ▼ After all questions
┌──────────────────┐
│  Groq LLM:       │
│  - Summary       │
│  - Strengths     │
│  - Weaknesses    │
│  - Recommendation│
└────────┬─────────┘
         │
         ▼ Persist + Publish
┌──────────────────┐    ┌──────────────────┐
│  PostgreSQL:     │    │ Kafka:           │
│  Save result     │    │ analysis-events  │
│  + questions     │    │ analysis.        │
│                  │    │ completed        │
└──────────────────┘    └──────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │ Interview Service│
                        │ updates          │
                        │ invitation with  │
                        │ analysis results │
                        └──────────────────┘
```

---

## Configuration

### Environment Variables

```bash
# Application
PORT=8005
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ai_video_interview_analysis
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Groq API
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=openai/gpt-oss-120b
GROQ_MAX_TOKENS=4096
GROQ_TEMPERATURE=0.3

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=ai-analysis-service
KAFKA_GROUP_ID=ai-analysis-group

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Observability
LOG_LEVEL=debug
LOKI_HOST=http://localhost:3100
JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

---

## Error Handling

| Scenario | Strategy |
|----------|----------|
| Groq rate limit (429) | Exponential backoff, max 3 retries |
| Groq API error (5xx) | Retry with backoff |
| Invalid JSON from LLM | Retry prompt (max 3 attempts) |
| Duplicate Kafka event | Skip (idempotency via processed_events) |
| Analysis failure | Mark as `failed`, publish `AnalysisFailedEvent` |
| Retry request | Re-run full analysis from scratch (all-or-nothing) |

---

## Dependencies

### Internal Services (via Kafka)
- **Interview Service** — Source of `invitation.completed` events (contains all data)
- **Interview Service** — Consumer of `analysis.completed` events

### External Services
- **Groq Cloud API** — LLM inference
- **PostgreSQL** — Persistence
- **Kafka** — Event streaming
- **Redis** — BullMQ for outbox processing

---

## File Structure

```
apps/ai-analysis-service/
├── src/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── analysis-result.aggregate.ts
│   │   ├── entities/
│   │   │   └── question-analysis.entity.ts
│   │   ├── value-objects/
│   │   │   ├── score.vo.ts
│   │   │   ├── recommendation.vo.ts
│   │   │   ├── analysis-status.vo.ts
│   │   │   ├── analysis-metadata.vo.ts
│   │   │   └── criteria-score.vo.ts
│   │   ├── events/
│   │   │   ├── analysis-started.event.ts
│   │   │   ├── analysis-completed.event.ts
│   │   │   └── analysis-failed.event.ts
│   │   ├── repositories/
│   │   │   └── analysis-result.repository.interface.ts
│   │   └── exceptions/
│   │       └── analysis.exceptions.ts
│   │
│   ├── application/
│   │   ├── ports/
│   │   │   ├── analysis-engine.port.ts
│   │   │   ├── event-publisher.port.ts
│   │   │   └── prompt-loader.port.ts
│   │   ├── commands/
│   │   │   ├── analyze-interview/
│   │   │   │   ├── analyze-interview.command.ts
│   │   │   │   └── analyze-interview.handler.ts
│   │   │   └── retry-analysis/
│   │   │       ├── retry-analysis.command.ts
│   │   │       └── retry-analysis.handler.ts
│   │   ├── queries/
│   │   │   ├── get-analysis-result/
│   │   │   ├── get-analysis-by-invitation/
│   │   │   └── list-analyses/
│   │   └── dto/
│   │
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── entities/
│   │   │   │   ├── analysis-result.entity.ts
│   │   │   │   ├── question-analysis.entity.ts
│   │   │   │   └── processed-event.entity.ts
│   │   │   ├── repositories/
│   │   │   │   └── typeorm-analysis-result.repository.ts
│   │   │   ├── mappers/
│   │   │   │   └── analysis-result.mapper.ts
│   │   │   └── migrations/
│   │   │       └── 1735900000000-InitialSchema.ts
│   │   │
│   │   ├── groq/
│   │   │   ├── groq-analysis-engine.ts
│   │   │   ├── groq.module.ts
│   │   │   └── prompt-loader.service.ts
│   │   │
│   │   ├── kafka/
│   │   │   └── consumers/
│   │   │       └── invitation-completed.consumer.ts
│   │   │
│   │   └── http/
│   │       └── controllers/
│   │           ├── analysis.controller.ts
│   │           ├── sandbox.controller.ts
│   │           └── health.controller.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

**Last Updated:** February 2026
