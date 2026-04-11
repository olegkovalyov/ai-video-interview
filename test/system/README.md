# System E2E Tests

End-to-end tests that run all microservices on test ports with real infrastructure (PostgreSQL, Redis, Kafka, Mailpit).

## Quick Start

```bash
# Run all categories sequentially
npm run system-test

# Run a single category
npm run system-test -- -c 01-sync-http

# Run multiple categories
npm run system-test -- -c 01-sync-http -c 07-auth

# List available categories
npm run system-test:list
```

## Prerequisites

```bash
docker compose up -d   # PostgreSQL, Redis, Kafka, Mailpit
```

## What Happens on Each Run

1. Infrastructure health checks (PostgreSQL, Redis, Kafka, Mailpit)
2. Test databases created (if not exist) + migrations
3. **Kafka full reset**: delete all consumer groups + delete/recreate all topics (empty)
4. 6 services started on test ports (9002-9010) via ts-node
5. Health check polling until all services ready
6. Jest runs categories sequentially with `--verbose`
7. Between categories: `afterAll` drains async pipelines (outbox, analysis)
8. Services stopped on exit

## Test Ports

| Service              | Port |
| -------------------- | ---- |
| User Service         | 9002 |
| Interview Service    | 9003 |
| AI Analysis Service  | 9005 |
| Notification Service | 9006 |
| Billing Service      | 9007 |
| API Gateway          | 9010 |

---

## Categories

### 01-sync-http (11 tests)

Synchronous HTTP request/response through Gateway and direct service calls.

**user-crud.spec.ts** (5 tests):

- Create user via direct service call (POST /users)
- Get user profile via gateway (GET /api/users/me)
- Update user profile via gateway (PUT /api/users/me)
- Verify updated profile returned correctly
- Handle non-existent user (>= 400)

**billing-plans.spec.ts** (3 tests):

- List available plans via gateway (GET /api/billing/plans) — returns free/plus/pro
- List plans via direct service call
- Check quota via direct service call (GET /api/billing/internal/quota/:companyId/interviews)

**correlation-id.spec.ts** (3 tests):

- Handle downstream service errors gracefully
- Propagate x-correlation-id header across services
- Auto-generate correlation-id when not provided

---

### 02-interview-lifecycle (11 tests)

Full interview lifecycle from template creation to completion.

**template-and-invitation.spec.ts** (10 tests):

- Create interview template (POST /api/templates)
- Add 3 questions to template
- Publish template (PUT /api/templates/:id/publish)
- Get published template via gateway — verify status=active, 3 questions
- Reject modifications on published template (>= 400)
- Create invitation for candidate
- Start interview as candidate
- Submit text responses for all 3 questions
- Complete interview
- Verify invitation status=completed via gateway

**full-journey.spec.ts** (1 test):

- End-to-end journey in single test: seed users → template → question → publish → invite → start → respond → complete → verify via gateway

---

### 03-kafka-async (7 tests)

Asynchronous event-driven flows via Kafka.

**user-created-events.spec.ts** (3 tests):

- Seed HR user (triggers user.created → Kafka user-events)
- Billing Service auto-creates free subscription via Kafka consumer (poll /api/billing/subscription)
- Notification Service sends welcome email via Kafka → SMTP → Mailpit (poll Mailpit API)

**interview-completed-events.spec.ts** (4 tests):

- Complete interview (triggers invitation.completed → Kafka interview-events)
- AI Analysis Service creates analysis record via Kafka (poll /api/v1/analysis/status/:invitationId)
- Wait for analysis to complete or fail (Groq API, ~12s)
- Notification Service sends "interview completed" email to HR via Mailpit

---

### 04-ai-analysis (5 tests)

AI-powered interview analysis via Groq LLM.

**analysis-flow.spec.ts** (5 tests):

_Sandbox (direct, no Kafka):_

- Check Groq API connectivity via sandbox endpoint (GET /sandbox/test-groq)
- Run full analysis via sandbox (POST /sandbox/analyze) — 1 question, validates score/recommendation/strengths/weaknesses

_Kafka-triggered (end-to-end):_

- Create analysis record via Kafka event (seed users → template → invite → respond → complete → poll analysis status)
- Wait for analysis to complete (Groq API scoring, ~12s)
- Verify analysis result propagated back to invitation (Interview Service consumes analysis.completed, updates invitation record with score/recommendation)

---

### 05-notifications (6 tests)

Email notifications via Mailpit and preference management.

**email-notifications.spec.ts** (6 tests):

_Email delivery:_

- Welcome email on user creation (user.created → Kafka → Notification Service → SMTP → Mailpit)
- Invitation email to candidate (invitation.created → Kafka → email)
- Verify email HTML body contains expected content (Mailpit API message body)

_Preferences CRUD:_

- Get default notification preferences (GET /api/preferences)
- Update preferences — disable in-app (PUT /api/preferences)
- Verify updated preferences returned correctly

---

### 06-billing-stripe (12 tests)

Subscription lifecycle, Stripe checkout, usage tracking, and quota enforcement.

**subscription-lifecycle.spec.ts** (12 tests):

_Subscription Lifecycle (5 tests):_

- Seed user → triggers user.created Kafka event
- Verify quota endpoint responds for new user
- Wait for free subscription auto-created via Kafka consumer (poll /api/billing/subscription)
- Get subscription details — planType=free, status=active, limits
- Check quota allows interviews on free plan

_Checkout & Cancel/Resume (3 tests):_

- Create Stripe Checkout session for upgrade to Plus (401 expected with sk_test_fake)
- Reject checkout for same plan transition (free → free, 400)
- Cancel free plan subscription (200, sets cancelAtPeriodEnd)

_Usage Tracking & Quota Enforcement (3 tests):_

- Verify 0 interviews used before completing any
- Complete interview → poll for usage increment via Kafka (invitation.completed → billing usage tracking)
- Verify quota enforcement on free plan (limit > 0, currentPlan=free)

_Stripe Webhook (1 test):_

- Reject webhook with invalid signature (400)

---

### 07-auth (6 tests)

Authentication and authorization through API Gateway.

**auth-flow.spec.ts** (6 tests):

- Allow access with valid internal token (x-internal-token header)
- Reject request without any token (401)
- Reject request with invalid internal token (401)
- Reject request with invalid JWT (401)
- Propagate user role from internal token (x-user-role header)
- Allow public endpoints without authentication (/health)

---

### 08-resilience (11 tests)

Error handling, health checks, and system resilience.

**service-resilience.spec.ts** (11 tests):

_Gateway Error Handling:_

- Return proper 4xx for non-existent resource (not 500)
- Preserve correlation-id in error responses
- Handle malformed JSON request body gracefully (400, not 500)
- Return 404 for non-existent route

_Rate Limiting & Timeouts:_

- Handle 10 concurrent requests without errors

_Health Checks (6 tests):_

- api-gateway responds to /health
- user-service responds to /health
- interview-service responds to /health
- billing-service responds to /health
- notification-service responds to /health
- ai-analysis-service responds to /health

---

## Coverage Gaps (TODO)

### Kafka Async Flows

- [ ] user.role-selected → Notification Service confirmation
- [ ] invitation.started → Notification Service email to HR
- [ ] analysis.failed → Notification Service failure email
- [ ] subscription.upgraded → Notification Service payment confirmed
- [ ] subscription.past_due → Notification Service payment failed
- [ ] quota.exceeded → Notification Service upgrade reminder

### Billing

- [x] Usage increment after interview completion (via Kafka) — covered in 06-billing-stripe
- [x] Quota enforcement — verified in 06-billing-stripe
- [ ] Stripe webhook: checkout.session.completed → subscription upgrade (requires real Stripe key)
- [ ] Stripe webhook: invoice.paid → period renewal (requires real Stripe key)
- [ ] Stripe webhook: invoice.payment_failed → past_due status (requires real Stripe key)
- [ ] Usage increment after analysis completion (token tracking)

### Auth (Keycloak)

- [ ] Full OIDC login flow with Keycloak
- [ ] Token refresh flow
- [ ] Registration saga: first login → user auto-creation
- [ ] Role-based access control (HR-only endpoints)

### Resilience

- [ ] Circuit breaker: service down → gateway returns 503
- [ ] Circuit breaker recovery: service comes back → requests resume
- [ ] Timeout handling: slow downstream → gateway timeout
- [ ] Graceful degradation: analysis service down → interview still works

### Media (planned)

- [ ] Video upload via presigned URL
- [ ] Transcription pipeline
- [ ] Storage quota enforcement
