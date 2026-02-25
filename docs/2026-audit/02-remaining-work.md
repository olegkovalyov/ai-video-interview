xn# 02 — Remaining Work (What's Left To Do)
/
## Priority Matrix

```
CRITICAL  ████  User Service P0 Bugs, CI/CD Pipeline
HIGH      ████  Media Service, Video Recording, Alert Rules
MEDIUM    ████  Notification Service, E2E Tests, Grafana Dashboards
LOW       ████  Billing Service, Analytics, Onboarding, Documentation
```

---

## CRITICAL Priority

### 1. User Service — Fix 22 Known Issues

**Source**: `docs/plan/USER-SERVICE-REFACTORING.md`

**P0 Bugs (5 issues, break data consistency)**:
- Missing Outbox events in `SuspendUserHandler` & `ActivateUserHandler` — other services never learn about status changes
- Missing Outbox events in Company handlers (create/update/delete) — no cross-service sync
- `Company.addUser()` primary user filter bug — mutable state, never matches
- NestJS exceptions thrown from Application layer — violates DDD layering
- No `UserActivatedEvent` — asymmetric with `UserSuspendedEvent`

**P1 Consistency Issues (8 issues)**:
- Value Objects inconsistently inherit from `ValueObject<T>` base class
- Dead code: `RoleAssignedEvent`, `RoleRemovedEvent`, `UserEventProducer` (243 lines, never injected)
- `SelectRoleHandler` doesn't publish to EventBus
- `DomainExceptionFilter` defined but never registered globally
- Outbox payload has inconsistent envelope structure
- EventID uses `Date.now()-random` instead of UUID

**P2 Code Quality (5 issues)**: `console.log` usage, duplicated shutdown logic, dead imports, hardcoded topics

**P3 Test Coverage (4 issues)**: No tests for mappers, guards, filters, outbox services

**Effort**: ~3-5 days | **Risk if skipped**: Data inconsistency across services

### 2. CI/CD Pipeline

**Current state**: Zero automation. No GitHub Actions, no linting/testing in PRs.

**Needed**:
- GitHub Actions workflows: lint, type-check, unit tests (per-service), build
- PR checks: require passing CI before merge
- Docker image builds for each service
- Deployment pipeline (staging → production)
- Secret management (Groq API key, Keycloak secrets, DB passwords)

**Effort**: ~2-3 days | **Risk if skipped**: Manual errors, no quality gates

---

## HIGH Priority

### 3. Media Service (port 8004)

**Specification**: Complete (in `docs/03-services/MEDIA_SERVICE.md`)
**Implementation**: 0%

**Phases**:
1. MinIO integration, presigned URL upload/download, file metadata persistence
2. FFmpeg video processing — WebM→MP4 (H.264), thumbnail generation, audio extraction
3. Groq Whisper transcription — 16kHz mono WAV, rate limiting (20 req/min)
4. BullMQ processing queue — concurrency 4, 3 retries, exponential backoff

**Domain model**: MediaFile aggregate, Transcription entity, processing pipeline
**Kafka**: Consumes `response.submitted` from interview-events, publishes media-events
**Database**: `ai_video_interview_media` (new), tables: media_files, transcriptions, processing_jobs

**Effort**: ~7-10 days | **Dependency**: Needed for real video interviews

### 4. Video Interview Recording (Frontend)

**Current state**: Interview flow exists but lacks actual video/audio capture.

**Needed**:
- WebRTC/MediaRecorder API integration in Next.js
- Camera/microphone permissions flow with fallbacks
- Recording UI: countdown timer, progress, re-record option
- Chunked upload to Media Service via presigned URLs
- Recording preview before submission

**Effort**: ~5-7 days | **Dependency**: Media Service (item #3)

### 5. Prometheus Alert Rules

**Current state**: `infra/observability/rules/` directory empty, no Alertmanager container.

**Needed**:
- Service health alerts (down > 1 min)
- Error rate alerts (> 5% errors in 5 min window)
- Kafka consumer lag alerts (lag > 1000 messages)
- DLQ message alerts (> 10 messages in any DLQ)
- Resource alerts (CPU > 80%, memory > 85%, disk > 90%)
- Groq API failure alerts (LLM down or rate limited)
- Alertmanager container in docker-compose.yml
- Notification channels (Slack/email/PagerDuty)

**Effort**: ~2 days | **Risk if skipped**: Silent failures in production

---

## MEDIUM Priority

### 6. Notification Service

**Specification**: Complete (in `docs/03-services/NOTIFICATION_SERVICE.md`)
**Implementation**: 0%

**Scope**:
- Email delivery via Resend/SendGrid (100 emails/day free tier)
- 12+ templates: welcome, interview_invitation, analysis_ready, candidate_approved, payment_failed, etc.
- Handlebars template engine with i18n (en, ru)
- Kafka consumers: user-events, interview-events, analysis-events
- Webhook integration for ATS systems (HMAC-SHA256 verification)
- BullMQ queue with 5 email workers

**Effort**: ~5-7 days | **Dependency**: Nice-to-have for UX, not blocking core flow

### 7. Grafana Dashboards

**Current state**: 1 unified dashboard works; `kafka-overview.json` and `system-overview.json` are 0-byte stubs.

**Needed**:
- Kafka dashboard: consumer lag, throughput, partition distribution, DLQ counts
- System dashboard: CPU, memory, disk, network per container
- Per-service dashboards: request rate, error rate, latency P50/P95/P99
- Business metrics: interviews created, analyses completed, active users

**Effort**: ~2-3 days

### 8. E2E Tests

**Current state**: Manual shell scripts in `scripts/` for testing flows. No automated E2E.

**Needed**:
- Full interview flow: register → create template → invite candidate → record → complete → AI analysis
- Auth flow: login → role selection → session management → logout
- Error scenarios: expired invitations, failed analysis, network errors
- Framework: Playwright or Cypress for frontend, Supertest for API

**Effort**: ~5-7 days

### 9. Load/Performance Testing

**Needed**:
- k6 or Artillery scripts for API Gateway throughput
- Kafka consumer throughput benchmarks
- Groq API rate limit behavior under load
- Database query performance profiling
- Baseline metrics for production capacity planning

**Effort**: ~3 days

---

## LOW Priority

### 10. Billing Service

**Specification**: Complete (in `docs/03-services/BILLING_SERVICE.md`)
**Implementation**: 0%

**Scope**:
- Stripe integration: checkout sessions, customer portal, webhooks
- Plans: Free (3 interviews/mo), Plus ($29, 100/mo), Pro ($99, unlimited)
- Usage tracking: Redis counters + PostgreSQL records
- Quota enforcement: API Gateway middleware → 402 Payment Required
- Kafka consumers for usage metering

**Effort**: ~7-10 days | **Dependency**: Stripe account setup, business model validation

### 11. Advanced Analytics

- ClickHouse integration (container exists but behind profile flag)
- Interview completion funnels
- AI scoring distribution analysis
- Time-to-hire metrics
- Company-level dashboards

### 12. Documentation Gaps

**Placeholder files that need content**:
- `docs/08-observability/METRICS_GUIDE.md` — placeholder (16 lines)
- `docs/08-observability/TRACING_GUIDE.md` — placeholder
- `docs/08-observability/ALERTS.md` — placeholder
- `docs/11-operations/` — empty
- `docs/12-decisions/` — ADR records not created
- `docs/13-roadmap/` — empty
- `docs/14-resources/` — empty
- `docs/09-security/` — empty

### 13. packages/ui/ — Shared Component Library

Declared workspace but 0% implemented. Currently all UI components live in `apps/web/`. Extract shared components if/when a second frontend (admin panel, mobile web) is needed.

---

## Dependency Graph

```
                    ┌─────────────────┐
                    │  User Service   │
                    │  P0 Bug Fixes   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌────────────┐  ┌─────────────┐  ┌──────────┐
     │   CI/CD    │  │   Media     │  │  Alert   │
     │  Pipeline  │  │  Service    │  │  Rules   │
     └──────┬─────┘  └──────┬──────┘  └──────────┘
            │               │
            ▼               ▼
     ┌─────────────┐  ┌──────────────┐
     │  E2E Tests  │  │   Video      │
     │             │  │  Recording   │
     └─────────────┘  └──────┬───────┘
                             │
                    ┌────────┴────────┐
                    │  Notification   │
                    │    Service      │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │    Billing      │
                    │    Service      │
                    └─────────────────┘
```

---

## Suggested Implementation Order

| Phase | Scope | Duration | Outcome |
|-------|-------|----------|---------|
| **Phase 2a** | User Service P0 fixes + CI/CD | ~1 week | Stable core, automated quality gates |
| **Phase 2b** | Media Service + Video Recording | ~2 weeks | Real video interviews work end-to-end |
| **Phase 2c** | Alert Rules + Grafana Dashboards | ~1 week | Observability complete for staging/prod |
| **Phase 3a** | Notification Service + E2E Tests | ~2 weeks | Polished UX, automated validation |
| **Phase 3b** | Kubernetes + Production Deploy | ~2 weeks | Platform goes live |
| **Phase 4** | Billing + Analytics | ~2 weeks | Monetization |

---

*Last updated: 2026-02-22*
