# 04 — Technical Roadmap

> Prioritized implementation plan with phases, dependencies, and effort estimates.
> Based on business process audit from 2026-03-27.

---

## Current State Summary

```
Backend Services:    ████████████████░░░░  80% (4/5 services + shared)
Frontend:            ████████████████░░░░  80% (pages done, gaps in API integration)
Observability:       ██████████████████░░  95%
Testing:             ████████████████░░░░  75% (1872 tests, unit+integration+e2e)
CI/CD:               ░░░░░░░░░░░░░░░░░░░░  0%
Production:          ░░░░░░░░░░░░░░░░░░░░  0%
Refactoring Plan:    ████████████████████  100% (Phases 1-5 complete)
```

---

## Phase A: Critical Bug Fixes (1-2 days)

> P0 issues from the business process audit. Must fix before any new features.

| #   | Task                                                                                           | Service     | Effort |
| --- | ---------------------------------------------------------------------------------------------- | ----------- | ------ |
| A1  | Fix `canBeModified()` — ACTIVE templates should be immutable                                   | Interview   | 30 min |
| A2  | Add DB constraints: UNIQUE(template_id, order), UNIQUE(invitation_id, question_id) + migration | Interview   | 1h     |
| A3  | Implement ExpirationSchedulerService with @Cron for expired/timed-out invitations              | Interview   | 2h     |
| A4  | Add AnalysisCompletedConsumer to Interview Service — update invitation with analysis results   | Interview   | 2h     |
| A5  | Implement Outbox pattern for AI Analysis event publishing (replace direct Kafka)               | AI Analysis | 3h     |

**Dependencies**: None (all independent)
**Verification**: Existing tests + new integration tests

---

## Phase B: Reliability & Observability (2-3 days)

> P1 issues. Required for staging environment.

| #   | Task                                                                   | Service         | Effort |
| --- | ---------------------------------------------------------------------- | --------------- | ------ |
| B1  | Implement heartbeat command (update lastActivityAt)                    | Interview       | 1h     |
| B2  | Increase analysis timeout to 30min (configurable per question count)   | AI Analysis     | 30 min |
| B3  | Fix consumer lag monitoring (implement real getHighWatermark)          | Shared          | 2h     |
| B4  | Add DLQ depth Prometheus gauges + alerts                               | All services    | 2h     |
| B5  | Add optimistic locking (@VersionColumn) to Template and User entities  | Interview, User | 2h     |
| B6  | Persist EXPIRED state when detected during invitation.start()          | Interview       | 1h     |
| B7  | Analyze empty responses as "no response" (score 0) instead of skipping | AI Analysis     | 1h     |
| B8  | Relax criteria validation — filter unknown criteria instead of failing | AI Analysis     | 30 min |

**Dependencies**: A3 must be done before B1 (heartbeat feeds into timeout detection)

---

## Phase C: CI/CD Pipeline (2-3 days)

> Enables safe iteration for all subsequent phases.

| #   | Task                                                             | Effort |
| --- | ---------------------------------------------------------------- | ------ |
| C1  | GitHub Actions: lint + type-check + unit tests on every PR       | 4h     |
| C2  | GitHub Actions: build Docker images for each service             | 2h     |
| C3  | GitHub Actions: integration tests (PostgreSQL service container) | 3h     |
| C4  | Branch protection rules: require CI pass before merge            | 30 min |
| C5  | Husky + lint-staged: pre-commit hooks                            | 1h     |
| C6  | Pin all Docker image versions (replace :latest)                  | 1h     |

**Workflow structure**:

```yaml
PR: lint → type-check → unit tests → build check
Merge: all PR checks → Docker build → push to registry
```

---

## Phase D: Media Service (7-10 days)

> Core product value — without video, it's just a form builder.

| #   | Task                                                                     | Effort |
| --- | ------------------------------------------------------------------------ | ------ |
| D1  | Scaffold NestJS service with DDD structure (port 8004)                   | 2h     |
| D2  | MinIO integration: presigned URL generation, webhook for upload complete | 4h     |
| D3  | MediaFile aggregate + TypeORM persistence + migrations                   | 4h     |
| D4  | FFmpeg transcoding pipeline: WebM → MP4 (H.264) via BullMQ               | 8h     |
| D5  | Thumbnail generation: extract frame at 1s                                | 2h     |
| D6  | Groq Whisper transcription: audio extraction + API call + persistence    | 6h     |
| D7  | Kafka events: media.ready, media.failed                                  | 2h     |
| D8  | Frontend: WebRTC/MediaRecorder integration in interview flow             | 12h    |
| D9  | Frontend: HR video playback with timeline sync                           | 8h     |
| D10 | Lifecycle cleanup: retention policy, auto-delete orphaned uploads        | 2h     |

**Dependencies**: Phase C (CI/CD) should be in place before starting

---

## Phase E: Notification Service (5-7 days)

| #   | Task                                                            | Effort |
| --- | --------------------------------------------------------------- | ------ |
| E1  | Scaffold NestJS service (port 8006)                             | 2h     |
| E2  | Email delivery via Resend API (primary) with SendGrid fallback  | 4h     |
| E3  | Handlebars template engine with 12 email templates              | 6h     |
| E4  | Kafka consumers: user-events, interview-events, analysis-events | 4h     |
| E5  | Notification preferences per user (opt-out)                     | 3h     |
| E6  | Webhook delivery with HMAC signing + retries                    | 4h     |
| E7  | In-app notifications via WebSocket (Redis pub/sub)              | 6h     |
| E8  | Scheduled emails: reminders (24h before expiry), weekly digest  | 3h     |

**Dependencies**: Phase A4 (analysis-events consumer) needed for E4

---

## Phase F: Billing Service (7-10 days)

| #   | Task                                                                    | Effort |
| --- | ----------------------------------------------------------------------- | ------ |
| F1  | Scaffold NestJS service (port 8007)                                     | 2h     |
| F2  | Stripe integration: checkout sessions, customer portal, webhooks        | 8h     |
| F3  | Subscription aggregate: create, upgrade, downgrade, cancel              | 4h     |
| F4  | Usage tracking: Redis counters per company/period                       | 4h     |
| F5  | Quota enforcement middleware in API Gateway                             | 4h     |
| F6  | Kafka consumers: track interviews, analyses, storage usage              | 3h     |
| F7  | Frontend: pricing page, checkout flow, billing dashboard                | 8h     |
| F8  | Plan definitions: Free (3/mo), Plus ($29, 100/mo), Pro ($99, unlimited) | 2h     |

**Dependencies**: Stripe account setup, Phase E (notifications for payment events)

---

## Phase G: Frontend Completion (5-7 days)

| #   | Task                                                  | Effort |
| --- | ----------------------------------------------------- | ------ |
| G1  | Replace 4 mock data files with real API calls         | 4h     |
| G2  | Implement avatar upload via MinIO presigned URLs      | 2h     |
| G3  | Connect interview creation form to real API           | 2h     |
| G4  | Migrate remaining components to React Query hooks     | 4h     |
| G5  | Add Playwright E2E tests (full interview flow)        | 8h     |
| G6  | Multi-language UI (React i18n, Russian locale)        | 6h     |
| G7  | HR Analytics dashboard (funnels, score distributions) | 8h     |

---

## Phase H: Production Readiness (5-7 days)

| #   | Task                                                                       | Effort |
| --- | -------------------------------------------------------------------------- | ------ |
| H1  | nginx reverse proxy (TLS, rate limiting, security headers, request limits) | 4h     |
| H2  | Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets)          | 8h     |
| H3  | Helm charts or Kustomize overlays per environment                          | 4h     |
| H4  | Database backup strategy (pg_dump + WAL archiving to S3)                   | 3h     |
| H5  | Kafka: 3-broker cluster, replication factor 3                              | 3h     |
| H6  | Redis Sentinel for HA                                                      | 2h     |
| H7  | Keycloak HA (2+ instances)                                                 | 3h     |
| H8  | Load testing with k6 (API Gateway throughput, analysis pipeline)           | 4h     |
| H9  | Runbook documentation for on-call                                          | 4h     |

---

## Dependency Graph

```
Phase A (Critical Fixes)
    │
    ├──→ Phase B (Reliability)
    │       │
    │       └──→ Phase H (Production)
    │
    ├──→ Phase C (CI/CD) ←── Start ASAP
    │       │
    │       ├──→ Phase D (Media Service)
    │       │       │
    │       │       └──→ Phase G (Frontend)
    │       │
    │       ├──→ Phase E (Notifications)
    │       │       │
    │       │       └──→ Phase F (Billing)
    │       │
    │       └──→ Phase G (Frontend)
    │
    └──→ Phase H (Production)
```

---

## Timeline Estimate

| Phase                | Duration | Can Parallel With |
| -------------------- | -------- | ----------------- |
| **A** Critical Fixes | 2 days   | —                 |
| **B** Reliability    | 3 days   | C                 |
| **C** CI/CD          | 3 days   | B                 |
| **D** Media Service  | 10 days  | E (partial)       |
| **E** Notifications  | 7 days   | D (partial)       |
| **F** Billing        | 10 days  | G                 |
| **G** Frontend       | 7 days   | F                 |
| **H** Production     | 7 days   | —                 |

**Critical path**: A → C → D → G → H = **~29 days**
**With parallelization**: **~22-25 days** to production-ready state

---

## Test Coverage Targets

| Layer                                       | Current        | Target               |
| ------------------------------------------- | -------------- | -------------------- |
| Domain (aggregates, VOs)                    | 90%            | 95%                  |
| Application (handlers)                      | 80%            | 90%                  |
| Infrastructure (outbox, consumers, mappers) | 70%            | 85%                  |
| E2E (full flows)                            | Manual scripts | Automated Playwright |
| Frontend                                    | 71 tests       | 200+ tests           |

---

_Created: 2026-03-27_
