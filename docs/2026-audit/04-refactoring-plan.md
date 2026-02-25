# 04 — Refactoring Master Plan

> Approved: 2026-02-24
> Status: **In Progress** — Phase 1

## Phases Overview

| # | Phase | Scope | Tasks | Status |
|---|-------|-------|-------|--------|
| 1 | User Service — P0 bugs | Data consistency, missing Outbox events, DDD violations | 12 | Pending |
| 2 | User Service — P1-P3 refactoring | Dead code, logging, tests, code quality | 13 | Pending |
| 3 | Interview Service — analysis & refactoring | Missing Outbox in 11 handlers, DDD violations, logging | 12 | Pending |
| 4 | AI Analysis Service — analysis & refactoring | Broken retry, duplicate logic, timeouts, metrics | 12 | Pending |
| 5 | API Gateway — analysis & refactoring | Circuit breaker, auth, security headers, timeouts | 10 | Pending |
| 6 | API Gateway — nginx layer | Add nginx in front (TLS, rate limiting, caching) | 7 | Pending |
| 7 | Distributed system bottleneck report | SPOF, timeouts, scaling — document + quick fixes | 8 | Pending |

**Total: ~74 tasks across 7 phases**

---

## Phase 1: User Service — P0 Bug Fixes

> These bugs break cross-service data consistency. Other services never learn about suspend/activate/company operations.

### 1.1 Create UserActivatedEvent (missing domain event)
- **File**: `apps/user-service/src/domain/events/` — create `user-activated.event.ts`
- **Pattern**: Mirror `UserSuspendedEvent` (has `userId`, `activatedBy`, `previousStatus`)
- **Update**: `user.aggregate.ts` — replace generic `UserUpdatedEvent({status: 'active'})` with `UserActivatedEvent`
- **Update**: `packages/shared/src/events/user.events.ts` — add `user.activated` integration event type

### 1.2 Fix missing Outbox in SuspendUserHandler
- **File**: `apps/user-service/src/application/commands/suspend-user/suspend-user.handler.ts`
- **Issue**: Only publishes to EventBus, no `OutboxService.saveEvent()`
- **Fix**: Add OutboxService injection + `saveEvent()` call after EventBus publish (mirror CreateUserHandler pattern)

### 1.3 Fix missing Outbox in ActivateUserHandler
- **File**: `apps/user-service/src/application/commands/activate-user/activate-user.handler.ts`
- **Same pattern as 1.2** — add OutboxService + `saveEvent()`

### 1.4 Fix missing Outbox in CreateCompanyHandler
- **File**: `apps/user-service/src/application/commands/hr/create-company/create-company.handler.ts`
- **Fix**: Inject OutboxService, call `saveEvent()` with `company.created` event type

### 1.5 Fix missing Outbox in UpdateCompanyHandler
- **File**: `apps/user-service/src/application/commands/hr/update-company/update-company.handler.ts`
- **Fix**: Same pattern — add OutboxService + `saveEvent()` for `company.updated`

### 1.6 Fix missing Outbox in DeleteCompanyHandler
- **File**: `apps/user-service/src/application/commands/hr/delete-company/delete-company.handler.ts`
- **Fix**: Same pattern — add OutboxService + `saveEvent()` for `company.deleted`

### 1.7 Fix Company.addUser() mutable state bug
- **File**: `apps/user-service/src/domain/aggregates/company.aggregate.ts`
- **Bug**: `filter(uc => uc.userId === userId)` — should be `filter(uc => uc.isPrimary)` to unset OTHER primary users
- **Impact**: Primary user assignment never works correctly

### 1.8 Replace NestJS exceptions in Application layer with Domain exceptions
- **Files**: `update-company.handler.ts`, `delete-company.handler.ts` (NotFoundException, ForbiddenException)
- **Fix**: Create `CompanyNotFoundException`, `CompanyAccessDeniedException` in `domain/exceptions/`
- **Fix**: Map them in DomainExceptionFilter to HTTP 404/403

### 1.9 Register DomainExceptionFilter globally
- **File**: `apps/user-service/src/main.ts`
- **Fix**: `app.useGlobalFilters(new DomainExceptionFilter())`

### 1.10 Fix SelectRoleHandler — missing EventBus publish
- **File**: `apps/user-service/src/application/commands/select-role/select-role.handler.ts`
- **Fix**: Add EventBus publishing of uncommitted domain events + Outbox for integration events

### 1.11 Run existing tests, verify no regressions
- `cd apps/user-service && npm run test`

### 1.12 Add tests for fixed handlers
- Test SuspendUserHandler publishes to Outbox
- Test ActivateUserHandler publishes to Outbox
- Test Company handlers publish to Outbox
- Test `Company.addUser()` isPrimary logic

---

## Phase 2: User Service — P1-P3 Refactoring

### 2.1 Standardize Value Objects — extend ValueObject\<T\>
- **Files**: `proficiency-level.vo.ts`, `years-of-experience.vo.ts`, `company-size.vo.ts`
- **Decision**: Migrate to `ValueObject<T>` base or document why enum-like VOs differ

### 2.2 Remove dead code — UserEventProducer
- **File**: `apps/user-service/src/infrastructure/kafka/producers/user-event.producer.ts` (243 lines)
- **Action**: Delete file, remove from KafkaModule providers/exports
- **Verify**: grep for any imports/injections before deleting

### 2.3 Remove dead domain events
- **Files**: `role-assigned.event.ts`, `role-removed.event.ts`
- **Action**: Delete if truly unused (verify with grep across codebase), or wire up if needed

### 2.4 Fix EventID generation — use UUID instead of Date.now()
- **File**: `apps/user-service/src/infrastructure/messaging/outbox/outbox.service.ts`
- **Fix**: Replace `Date.now()-random` with `uuid()` (package already available)

### 2.5 Standardize Outbox event envelope
- **Issue**: Handlers create double-nested payload (envelope inside envelope)
- **Fix**: Handlers pass only business data; OutboxService wraps in standard envelope

### 2.6 Replace console.log with LoggerService
- **Files**: `outbox.service.ts` (4 instances), `main.ts` (2 instances), other infra files
- **Action**: Inject LoggerService, replace all console.log calls

### 2.7 Fix dual graceful shutdown in main.ts
- **File**: `apps/user-service/src/main.ts`
- **Fix**: Remove manual signal handlers, keep only `app.enableShutdownHooks()`

### 2.8 Replace hardcoded topic names with KAFKA_TOPICS constants
- **Action**: Use constants from `@repo/shared` everywhere instead of string literals

### 2.9 Fix MinIO bucket initialization
- **Action**: Ensure bucket init runs on service startup (check if commented out)

### 2.10 Add tests for mappers
- User, Company, Skill, CandidateSkill mappers — all in `infrastructure/persistence/mappers/`

### 2.11 Add tests for guards and filters
- InternalServiceGuard, RolesGuard, DomainExceptionFilter

### 2.12 Add tests for Outbox services
- OutboxService, OutboxPublisher, OutboxScheduler

### 2.13 Run full test suite + verify
- `cd apps/user-service && npm run test`

---

## Phase 3: Interview Service — Analysis & Refactoring

### 3.1 **CRITICAL**: Fix Outbox integration in ALL command handlers
- **Issue**: 11 command handlers don't call `OutboxService.saveEvent()`
- **Exception**: Only InvitationCompletedHandler (event handler) uses Outbox
- **Files** (all need OutboxService injection + saveEvent):
  - `create-template.handler.ts`, `update-template.handler.ts`, `delete-template.handler.ts`
  - `publish-template.handler.ts`, `add-question.handler.ts`, `remove-question.handler.ts`
  - `reorder-questions.handler.ts`, `create-invitation.handler.ts`, `start-invitation.handler.ts`
  - `submit-response.handler.ts`, `complete-invitation.handler.ts`

### 3.2 Replace generic Error with DomainException in aggregates
- **File**: `interview-template.aggregate.ts` — `throw new Error(...)` → `throw new TemplateDomainException(...)`
- **File**: `invitation.aggregate.ts` — same pattern
- **File**: `template-status.vo.ts` — same pattern

### 3.3 Replace NestJS exceptions in Application layer
- Create domain-specific exceptions: `TemplateNotFoundException`, `InvitationAccessDeniedException`, etc.
- Map them in DomainExceptionFilter to appropriate HTTP status codes

### 3.4 Register DomainExceptionFilter globally
- **File**: `apps/interview-service/src/main.ts`

### 3.5 Replace NestJS Logger with Winston LoggerService
- **Issue**: All handlers use `new Logger(HandlerName.name)` instead of injected LoggerService
- **Action**: Inject and use LoggerService for structured logging to Loki

### 3.6 Replace console.log with LoggerService
- **Files**: `outbox.service.ts`, `main.ts`

### 3.7 Fix EventID generation — UUID
- Same pattern as User Service (2.4)

### 3.8 Fix dual graceful shutdown
- Same pattern as User Service (2.7)

### 3.9 Replace hardcoded topic names with KAFKA_TOPICS constants

### 3.10 Verify state machine edge cases
- Template: draft→active→archived transitions
- Invitation: pending→in_progress→completed/expired transitions
- Check: Can a completed invitation be re-started? Can an archived template be un-archived?

### 3.11 Add missing tests
- Outbox integration in handlers, state machine edge cases, DomainExceptionFilter

### 3.12 Run full test suite
- `cd apps/interview-service && npm run test`

---

## Phase 4: AI Analysis Service — Analysis & Refactoring

### 4.1 **CRITICAL**: Fix broken RetryAnalysis handler
- **File**: `apps/ai-analysis-service/src/application/commands/retry-analysis/retry-analysis.handler.ts`
- **Bug**: Deletes failed analysis, then passes empty questions/responses to AnalyzeInterviewCommand
- **Fix**: Store original event data in analysis record (new `sourceEventData` column), or fetch from interview-service

### 4.2 Consolidate duplicate analysis logic (~150 LOC)
- **Issue**: Duplicated between `AnalyzeInterviewHandler` and `InvitationCompletedConsumer`
- **Fix**: Extract `AnalysisExecutionService` in application layer
- **Kafka consumer** should dispatch to CQRS handler, not process directly

### 4.3 Fix hardcoded model names
- Consumer: `'openai/gpt-oss-120b'` vs Handler: `'llama-3.3-70b-versatile'`
- **Fix**: Both should read from `ConfigService.get('GROQ_MODEL')`

### 4.4 Add timeout protection for long analyses
- **Issue**: 50+ question interview = 250+ seconds processing, blocks Kafka consumer
- **Fix**: Add 10-minute global timeout with `Promise.race()`

### 4.5 Fix eager loading in AnalysisResult entity
- **Fix**: Remove `eager: true` on questionAnalyses relation, use explicit joins when needed

### 4.6 Add input sanitization for LLM prompts
- Truncate question/response text to max 2000 chars, escape special characters

### 4.7 Extract magic numbers to named constants
- `RATE_LIMIT_DELAY_MS = 5000`, `RETRY_BUFFER_MS = 500`, `CHUNKED_SUMMARY_THRESHOLD = 30`, `MAX_QUESTIONS_PER_CHUNK = 15`

### 4.8 Add error handling for chunked summary parsing
- Wrap `JSON.parse` in try/catch (like single summary method already does)

### 4.9 Replace console.log in sandbox controller

### 4.10 Add Prometheus metrics for analysis pipeline
- Histograms: analysis duration, token usage, LLM response time
- Counters: success/failure, questions per analysis

### 4.11 Add processed_events cleanup job
- Scheduled job to delete events older than 30 days (table grows unbounded)

### 4.12 Run full test suite
- `cd apps/ai-analysis-service && npm run test`

---

## Phase 5: API Gateway — Analysis & Refactoring

### 5.1 Fix circuit breaker race condition
- **File**: `apps/api-gateway/src/core/circuit-breaker/circuit-breaker.ts`
- **Issue**: `failures.shift()` is O(n), non-atomic with `failures.length` read
- **Fix**: Use Map-based approach or circular buffer with atomic counter

### 5.2 Fix proxy timeout (5s too short for analysis)
- **Fix**: Make timeout configurable per-service: User 5s, Interview 10s, Analysis 30s

### 5.3 Add JWKS caching with TTL refresh
- **Fix**: 15-minute TTL, background refresh, stale-while-revalidate pattern

### 5.4 Add rate limiting on auth endpoints
- `/auth/login`, `/auth/register`, `/auth/refresh`
- Redis-backed sliding window counter

### 5.5 Fix error handling in BaseServiceProxy
- Network errors mapped to status 0 → distinguish ECONNREFUSED (503), ETIMEDOUT (504)

### 5.6 Add null check in registration saga
- Check `getUserById()` result before accessing properties

### 5.7 Fix orphaned user tracking in compensation
- Inject `OrphanedUsersService` in RegistrationSaga (currently missing)

### 5.8 Add security headers
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`

### 5.9 Validate audience in JWT verification
- Throw error if `KEYCLOAK_CLIENT_ID` not configured (currently silently skips audience check)

### 5.10 Add circuit breaker cleanup on module destroy
- `clearInterval()` in `onModuleDestroy()` to prevent memory leaks

---

## Phase 6: API Gateway — nginx Layer

> **Decision**: Option A approved — nginx in front of NestJS gateway.

### Architecture
```
Client → nginx (80/443) → NestJS API Gateway (8001) → Services (8002-8005)
                 │
                 ├── TLS termination
                 ├── Rate limiting (login: 10/min, API: 100/min)
                 ├── Security headers
                 ├── Request size limits (10MB)
                 └── Static file caching
```

### Tasks
1. Create `infra/nginx/nginx.conf` with upstream definitions for all services
2. Create `infra/nginx/conf.d/` with per-route configurations
3. Add nginx container to `docker-compose.yml` (port 80/443 → NestJS 8001)
4. Configure rate limiting zones (login, API, webhooks)
5. Add security headers (CSP, X-Content-Type-Options, X-Frame-Options)
6. Configure request size limits (10MB body default, 100MB for media uploads)
7. Add TLS configuration (self-signed for dev, Let's Encrypt ready for prod)

---

## Phase 7: Distributed System Bottleneck Report

### Analysis & Documentation

Write `docs/2026-audit/05-bottleneck-analysis.md` covering:

**Single Points of Failure**:
1. Kafka single broker — events lost on crash
2. PostgreSQL single instance — all services blocked
3. Redis single instance — outbox jobs lost
4. Keycloak single instance — all auth fails
5. API Gateway single instance — total outage

**Timeout Chain Mismatches**:
- Frontend 30s → Gateway 5s → Service 30s → DB 30s (gateway is the bottleneck)

**Outbox Table Growth**:
- No cleanup of stuck events, no index on `(status, publishedAt)`
- `processed_events` table has no TTL (unbounded growth)

**Kafka Consumer Risks**:
- Analysis: 5s×30 questions = 150s per message (risk of consumer eviction with 60+ questions)
- No consumer lag monitoring

**Groq Rate Limiting**:
- ~12 req/min per consumer on free tier
- 10 concurrent interviews would exceed limits
- No daily token budget tracking

### Quick Fixes (implement during phases 1-5)
1. Increase Gateway proxy timeout for analysis routes
2. Add outbox cleanup index: `CREATE INDEX idx_outbox_status_published ON outbox(status, published_at)`
3. Add processed_events TTL cleanup job (30 days)
4. Configure per-service circuit breaker timeouts

### Production Readiness (separate effort, document recommendations)
- 3-broker Kafka cluster, RF=3
- PgBouncer connection pooling
- Redis Sentinel or Cluster
- Keycloak HA (2+ instances)
- API Gateway horizontal scaling behind nginx

---

## Execution Strategy

1. Work through phases **sequentially** (1→2→3→4→5→6→7)
2. Each phase: create task list → implement → test → verify
3. After each phase verify:
   - `npm run test --filter=<service>` — unit tests pass
   - `npm run check-types` — no type errors
   - `npm run lint` — no lint errors
4. Phases 6-7 also produce documentation artifacts in `docs/2026-audit/`

---

*Created: 2026-02-24*
