# Phase 1 — Feature Completeness (Detailed Plan)

**Created**: 2026-04-12
**Estimated duration**: 20-25 days
**Goal**: Make the platform fully functional for MVP launch

---

## 1.1 Email Notifications (3-4 days)

### 1.1.1 Keycloak Email Configuration

- Configure Keycloak SMTP settings (Resend or SendGrid free tier)
- Enable email verification on registration
- Enable password reset email flow
- Custom email templates in Keycloak matching platform branding (Light Professional)

### 1.1.2 Notification Service — SMTP Integration

- Replace Mailpit (dev) with real SMTP provider (Resend: 3000 emails/month free)
- Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` env vars
- Verify email delivery in production mode

### 1.1.3 Email Templates (Handlebars)

Create branded email templates for:

| Event                       | Recipient    | Content                                                |
| --------------------------- | ------------ | ------------------------------------------------------ |
| `user.created`              | Candidate/HR | Welcome email, getting started guide                   |
| `invitation.created`        | Candidate    | Interview invitation with link, deadline, company info |
| `invitation.completed`      | HR           | Candidate finished — link to review page               |
| `analysis.completed`        | HR           | AI analysis ready — score, recommendation, review link |
| `analysis.completed`        | Candidate    | Results available — link to view results               |
| `candidate.approved`        | Candidate    | Congratulations email from HR                          |
| `candidate.rejected`        | Candidate    | Thank you for participating email                      |
| `subscription.changed`      | HR           | Plan change confirmation (upgrade/downgrade/cancel)    |
| `subscription.trial_ending` | HR           | Trial ending in 3 days reminder                        |
| `invitation.reminder`       | Candidate    | Deadline approaching (24h before expiry)               |

### 1.1.4 In-App Notifications

- Bell icon in app-header with unread count badge
- Notification dropdown/panel (latest 10 notifications)
- Mark as read / mark all as read
- Notification types: info, success, warning
- Persist in notification-service DB (`notifications` table per user)
- API: `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`

### 1.1.5 Notification Preferences

- Profile page → Notifications tab
- Toggle per channel: Email / In-App
- Toggle per event type: Invitations / Results / Billing
- API: `GET /api/notifications/preferences`, `PUT /api/notifications/preferences`

**Files to create/modify**:

- `apps/notification-service/` — SMTP config, Handlebars templates
- `apps/web/components/layout/app-header.tsx` — bell icon + dropdown
- `apps/web/features/notifications/` — new feature module
- `apps/web/app/(app)/profile/notifications/page.tsx` — preferences page
- `infra/keycloak/` — SMTP realm config

---

## 1.2 Real-time Updates (1-2 days)

### 1.2.1 WebSocket Integration

- Notification-service already has `socket.io` dependency
- API Gateway proxies WebSocket connections to notification-service
- Frontend: `useSocket()` hook connecting on auth
- Events pushed to connected HR users:
  - `invitation.started` — candidate opened the exam
  - `invitation.completed` — candidate finished
  - `analysis.completed` — AI results ready
  - `notification.new` — triggers bell icon badge update

### 1.2.2 Polling Fallback

- Invited tab: `refetchInterval: 30_000` on `useHRInvitations`
- Completed tab: `refetchInterval: 30_000` when analysis pending
- Analysis detail: already polling at 10s (implemented)

### 1.2.3 Optimistic UI

- When WebSocket event received → `queryClient.invalidateQueries`
- Instant UI update without page refresh

**Files to create/modify**:

- `apps/web/lib/hooks/use-socket.ts` — WebSocket hook
- `apps/web/components/layout/app-header.tsx` — real-time badge
- `apps/notification-service/src/infrastructure/websocket/` — gateway
- `apps/api-gateway/` — WebSocket proxy config

---

## 1.3 HR Actions — Approve/Reject Candidate (2-3 days)

### 1.3.1 Domain Model

- New `CandidateDecision` concept on `Invitation` aggregate
- Fields: `decision: 'approved' | 'rejected' | null`, `decisionAt`, `decisionNote`
- New domain events: `CandidateApprovedEvent`, `CandidateRejectedEvent`
- Business rule: can only decide on completed invitations with analysis

### 1.3.2 Backend

- New commands: `ApproveCandidate`, `RejectCandidate`
- Each takes: `invitationId`, `hrUserId`, `note` (optional message to candidate)
- Interview-service publishes events to Kafka → Notification-service sends email

### 1.3.3 Frontend — HR Review Page

- Two buttons on review detail page (after analysis completed):
  - "Approve" (green) → confirmation dialog with optional note → API call
  - "Reject" (red) → confirmation dialog with required note → API call
- After decision: badge on review page (Approved/Rejected), buttons disabled
- Completed tab: show decision badge per candidate

### 1.3.4 Email to Candidate

- `candidate.approved`: "Congratulations! You have been approved for [position] at [company]"
- `candidate.rejected`: "Thank you for your time. Unfortunately, we decided not to proceed..."
- Include HR note if provided
- Branded HTML template

### 1.3.5 Candidate Dashboard

- Invitation card shows decision status:
  - Pending review (waiting for HR)
  - Approved (green badge + date)
  - Rejected (with feedback note from HR)

**Files to create/modify**:

- `apps/interview-service/src/domain/` — decision fields, events, commands
- `apps/interview-service/src/infrastructure/persistence/migrations/` — add decision columns
- `apps/api-gateway/src/modules/interview-service/` — new endpoints
- `apps/web/app/(app)/hr/review/[id]/page.tsx` — approve/reject buttons
- `apps/web/app/(app)/candidate/dashboard/page.tsx` — decision display
- `apps/notification-service/` — email templates for approve/reject

---

## 1.4 Candidate View Results (2-3 days)

### 1.4.1 Backend — Candidate Analysis Access

- New endpoint: `GET /api/analysis/candidate/:invitationId`
- Returns limited data: overall score, recommendation, per-question feedback
- Excludes HR-only data: criteria weights, model info, token usage, processing time
- Auth: candidate can only see their own results

### 1.4.2 Frontend — Results Page

- New page: `/candidate/results/:invitationId`
- Accessible from candidate dashboard (after analysis completed)
- Shows:
  - Overall score with color indicator
  - Recommendation badge (hire/consider/reject)
  - Summary text
  - Strengths and weaknesses
  - Per-question: question text, your answer, AI score, AI feedback
- Print-friendly layout

### 1.4.3 Candidate Dashboard Update

- Interview cards: show analysis status
  - "Analyzing..." spinner while in_progress
  - Score + recommendation when completed
  - "View Results" button → navigates to results page
  - Decision from HR (if available)

**Files to create/modify**:

- `apps/ai-analysis-service/src/infrastructure/http/controllers/` — candidate endpoint
- `apps/api-gateway/src/modules/analysis-service/` — proxy new endpoint
- `apps/web/lib/api/analysis.ts` — `getCandidateAnalysis()`
- `apps/web/app/(app)/candidate/results/[id]/page.tsx` — new page
- `apps/web/app/(app)/candidate/dashboard/page.tsx` — update cards

---

## 1.5 Billing & Subscriptions (4-5 days)

### 1.5.1 Stripe Integration (billing-service already has DDD + CQRS)

- Stripe test mode keys in env
- Products + Prices created in Stripe Dashboard:
  - Free: 5 interviews/month, basic AI analysis
  - Plus ($29/mo): 50 interviews/month, full analysis, export
  - Pro ($99/mo): unlimited, priority analysis, comparison view, API access
- Webhook endpoint: `POST /api/billing/webhook` (Stripe events)

### 1.5.2 Frontend — Pricing Page

- Public page: `/pricing`
- Three plan cards with features comparison
- "Current Plan" badge for logged-in users
- Upgrade/downgrade buttons → Stripe Checkout Session

### 1.5.3 Frontend — Subscription Management

- HR profile → Billing tab
- Current plan, next billing date, payment method
- Usage bar: X/Y interviews used this month
- Upgrade/downgrade/cancel buttons
- Invoice history

### 1.5.4 Paywall Enforcement

- API Gateway checks quota before creating invitation
- If quota exceeded → 402 Payment Required
- Frontend shows upgrade prompt with link to pricing

### 1.5.5 Billing Emails

- Subscription created/changed/cancelled → email via notification-service
- Payment failed → email with retry link
- Trial ending (3 days before) → reminder email

**Files to create/modify**:

- `apps/billing-service/` — Stripe client, webhook handler
- `apps/api-gateway/` — quota check middleware, billing proxy
- `apps/web/app/(marketing)/pricing/page.tsx` — pricing page
- `apps/web/app/(app)/profile/billing/page.tsx` — subscription management
- `apps/web/features/billing/` — new feature module

---

## 1.6 Interview Page Redesign + Proctoring (3-4 days)

### 1.6.1 UX/UI Redesign

- Replace glassmorphism (purple gradient) with Light Professional theme
- Clean white background, shadcn components
- Better question navigation (stepper, keyboard shortcuts)
- Timer redesign (less intrusive, configurable position)
- Mobile-responsive layout
- Loading states and transitions between questions

### 1.6.2 Anti-Cheating — Browser Monitoring

Track and report violations to HR:

| Violation       | Detection Method                     | Severity |
| --------------- | ------------------------------------ | -------- |
| Tab switch      | `document.visibilitychange`          | Medium   |
| Window blur     | `window.blur` event                  | Medium   |
| Exit fullscreen | `fullscreenchange` event             | High     |
| Copy/paste      | `copy`, `paste` events — block + log | Medium   |
| Right-click     | `contextmenu` event — block + log    | Low      |
| DevTools open   | Window resize heuristic              | High     |
| Screenshot      | Cannot detect in browser             | --       |

### 1.6.3 Fullscreen Mode

- Request fullscreen on interview start (`document.requestFullscreen()`)
- Warning banner when exited: "Please return to fullscreen mode"
- Count fullscreen exits as violations
- Configurable per template: `requireFullscreen: boolean`

### 1.6.4 Violation Tracking

- `useProctoring` hook (already exists, needs enhancement)
- Store violations in invitation: `violations: { type, timestamp, count }[]`
- New field on invitation entity: `violations: jsonb`
- Submit violations with each response or on complete
- HR review page: "Proctoring Report" section showing all violations with timestamps

### 1.6.5 HR Template Settings

- New template settings:
  - `requireFullscreen: boolean` (default: true)
  - `trackViolations: boolean` (default: true)
  - `maxViolations: number` (default: 10, auto-complete if exceeded)
- Step 3 of template wizard: add proctoring settings

### 1.6.6 HR Review — Proctoring Report

- New section on review detail page between stats and questions
- Shows: total violations, violation timeline, severity breakdown
- Warning banner if > 5 violations: "Suspicious activity detected"

**Files to create/modify**:

- `apps/web/app/(interview)/` — full UI redesign
- `apps/web/app/(interview)/interview/[invitationId]/_hooks/useProctoring.ts` — enhance
- `apps/web/app/(interview)/interview/[invitationId]/_components/` — all components
- `apps/interview-service/src/domain/` — violations field
- `apps/interview-service/src/infrastructure/persistence/migrations/` — violations column
- `apps/web/app/(app)/hr/review/[id]/page.tsx` — proctoring report section
- Template wizard Step 3 — proctoring settings

---

## 1.7 Export (2 days)

### 1.7.1 PDF Export

- Review detail page → "Export PDF" button
- Server-side generation via Puppeteer or client-side via `@react-pdf/renderer`
- Content: candidate info, scores, AI summary, per-question analysis
- Branded header/footer with company logo

### 1.7.2 CSV Export

- Completed candidates tab → "Export CSV" button
- Columns: name, email, template, score, recommendation, date, company
- Bulk export: all completed or filtered results
- Client-side CSV generation (no backend needed)

**Files to create/modify**:

- `apps/web/lib/export/pdf.ts` — PDF generation
- `apps/web/lib/export/csv.ts` — CSV generation
- `apps/web/app/(app)/hr/review/[id]/page.tsx` — PDF button
- `apps/web/features/hr-candidates/components/CandidateCompletedTab.tsx` — CSV button

---

## 1.8 Comparison View (2-3 days)

### 1.8.1 Candidate Selection

- Completed tab: checkbox per candidate card
- Floating action bar: "Compare X Selected" button (2-4 max)
- Navigate to `/hr/compare?ids=id1,id2,id3`

### 1.8.2 Comparison Page

- Side-by-side cards (2-4 columns)
- Per candidate: name, score, recommendation, strengths, weaknesses
- Per-question score comparison (table or bar chart)
- Radar chart: criteria scores overlay (relevance, completeness, clarity, depth)
- Highlight best/worst per question
- "Approve" / "Reject" buttons per candidate (reuse from 1.3)

### 1.8.3 Data Fetching

- Fetch multiple analyses in parallel: `Promise.all(ids.map(getAnalysis))`
- React Query with `useQueries` for parallel fetching

**Files to create/modify**:

- `apps/web/app/(app)/hr/compare/page.tsx` — comparison page
- `apps/web/features/hr-candidates/components/CandidateCompletedTab.tsx` — checkbox + compare button
- `apps/web/lib/api/analysis.ts` — batch fetch helper

---

## 1.9 Bulk Actions (1-2 days)

### 1.9.1 Invited Tab

- Checkbox per invitation card
- Bulk actions dropdown:
  - Resend invitation email (selected)
  - Cancel invitations (selected) → confirmation dialog
  - Export selected to CSV

### 1.9.2 Completed Tab

- Checkbox per completed interview card
- Bulk actions:
  - Export selected to CSV/PDF
  - Compare selected (navigates to comparison view)
  - Bulk approve/reject (with shared note)

### 1.9.3 Backend

- Batch endpoints: `POST /api/invitations/batch/cancel`, `POST /api/invitations/batch/resend`
- Batch approve/reject: `POST /api/invitations/batch/decide`
- Each emits individual Kafka events (notifications per candidate)

**Files to create/modify**:

- `apps/web/features/hr-candidates/components/CandidateInvitedTab.tsx` — checkboxes + actions
- `apps/web/features/hr-candidates/components/CandidateCompletedTab.tsx` — checkboxes + actions
- `apps/interview-service/src/infrastructure/http/controllers/invitations.controller.ts` — batch endpoints
- `apps/api-gateway/src/modules/interview-service/controllers/invitations.controller.ts` — proxy

---

## Execution Order (Recommended)

```
Week 1:  1.1 (Notifications) + 1.2 (Real-time)
Week 2:  1.3 (HR Approve/Reject) + 1.4 (Candidate Results)
Week 3:  1.5 (Billing)
Week 4:  1.6 (Interview Redesign + Proctoring)
Week 5:  1.7 (Export) + 1.8 (Comparison) + 1.9 (Bulk Actions)
```

Notifications first because many features depend on email delivery.
Billing can run in parallel with HR actions.
Interview redesign is independent and can be done anytime.
Export, comparison, and bulk actions are small and can fill gaps.

---

## Definition of Done (per feature)

- [ ] Backend: domain model, commands/queries, tests (unit + integration)
- [ ] API Gateway: proxy endpoints, DTOs with validation
- [ ] Frontend: UI components, React Query hooks, error handling
- [ ] Kafka events: published and consumed correctly
- [ ] Email: template created, delivery verified
- [ ] Tests: all existing tests still pass + new tests for new functionality
- [ ] Manual E2E: full flow tested in browser
