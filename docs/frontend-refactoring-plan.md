# Frontend Refactoring Plan

**Created:** 2026-04-04
**Color Scheme:** Light Professional (Scheme 3)
**Approach:** Feature-by-feature, each step independently deployable

---

## Phase 0: Theme & Design System (foundation)

Before touching any feature, establish the design system.

### 0.1 — Tailwind Theme Configuration

- [ ] Extend `tailwind.config.cjs` with Light Professional color palette
- [ ] Define CSS variables in `globals.css` for shadcn compatibility
- [ ] Colors: backgrounds (#FAFBFC, #FFFFFF), text (#0F172A, #475569, #94A3B8), accent (indigo #4F46E5, purple #7C3AED), semantic (success #059669, warning #D97706, error #DC2626, info #2563EB)
- [ ] Update shadcn `components.json` baseColor if needed

### 0.2 — Core UI Components

- [ ] Update `button.tsx` variants — primary (indigo), gradient (indigo→purple CTA), outline, ghost, destructive
- [ ] Update `card.tsx` — white bg, subtle border (#E2E8F0), light shadow, hover with accent border
- [ ] Update `badge.tsx` — semantic colors: success (green bg/text), warning (amber), error (red), info (blue)
- [ ] Update `input.tsx` — white bg, border, focus ring (indigo)
- [ ] Create `score-circle.tsx` — colored circle for analysis scores (high/mid/low)
- [ ] Create `stat-card.tsx` — reusable dashboard stat card

### 0.3 — Layout Redesign

- [ ] Add collapsible sidebar navigation (replace top header for app shell)
- [ ] Sidebar: logo, nav items with icons (lucide-react), active state (indigo bg), role-based menu
- [ ] Responsive: sidebar collapses to hamburger on mobile
- [ ] Update header — minimal: breadcrumb + search + user avatar/dropdown
- [ ] Dark mode toggle in user dropdown (next-themes already configured)

### 0.4 — Marketing Pages

- [ ] Update landing page hero — Light Professional gradient, clean typography
- [ ] Update pricing page — cards with Light Professional palette
- [ ] Update about page — consistent styling

**Estimated effort:** 2-3 days

---

## Phase 1: Fix Mock Data → Real API (critical)

Two features still use mock data despite having real API implementations ready.

### 1.1 — Interviews Feature (mock → real)

- [ ] Replace `MOCK_INTERVIEWS` in `InterviewsList.tsx` with `useInvitations()` React Query hook
- [ ] Replace `MOCK_INTERVIEWS` in `InterviewsGrid.tsx` with same hook
- [ ] Wire up interview creation form to `POST /api/invitations`
- [ ] Wire up interview detail page to `GET /api/invitations/:id`
- [ ] Wire up interview review page to analysis results API
- [ ] Delete `features/interviews/services/interviews-mock.ts`
- [ ] Delete `features/interviews/hooks/use-interviews.ts` (replace with `lib/query/hooks/use-invitations.ts`)

### 1.2 — Candidates Feature (mock → real)

- [ ] Replace `MOCK_CANDIDATES` in `CandidatesList.tsx` with `searchCandidates()` from `lib/api/candidate-search.ts`
- [ ] Create React Query hook `useCandidateSearch()` in `lib/query/hooks/`
- [ ] Wire up candidate filters to real API query params
- [ ] Delete `features/candidates/services/candidates-mock.ts`
- [ ] Delete `features/candidates/hooks/use-candidates.ts`

### 1.3 — Cleanup Deprecated Files

- [ ] Delete `features/templates/services/mock-data.ts`
- [ ] Delete `features/templates/services/storage.service.ts`
- [ ] Delete `features/users/services/users-mock.ts`

**Estimated effort:** 1-2 days

---

## Phase 2: Consistent React Query Usage

Some components call API directly with useState/useEffect instead of React Query.

### 2.1 — Skills Feature

- [ ] Refactor `SkillsList.tsx` — replace direct `listSkills()`/`listCategories()` calls with `useSkills()` React Query hook
- [ ] Remove manual loading/error state management (let React Query handle it)

### 2.2 — Candidate Skills Feature

- [ ] Refactor `CandidateSkillsList.tsx` — replace direct API calls with React Query hooks
- [ ] Use `useMutation()` for add/update/remove skill operations with optimistic updates

### 2.3 — HR Candidates Feature

- [ ] Wrap `searchCandidates()` in `CandidateSearchTab.tsx` with React Query hook
- [ ] Add proper caching for search results

### 2.4 — Profile Feature

- [ ] Fix avatar upload — integrate FormData into `apiPost()` or create `apiUpload()` helper
- [ ] Use `useMutation()` for profile updates with cache invalidation

**Estimated effort:** 1 day

---

## Phase 3: Route Deduplication & Navigation

### 3.1 — Fix Duplicate Routes

- [ ] Consolidate `/hr/interviews/templates/` into `/hr/templates/` (duplicate structure)
- [ ] Verify all navigation links point to canonical paths
- [ ] Remove orphaned route files

### 3.2 — Dashboard Pages

- [ ] HR Dashboard — real stats from API (templates count, active interviews, pending reviews)
- [ ] Candidate Dashboard — real data (pending invitations, completed interviews, skills count)
- [ ] Admin Dashboard — real stats (total users, active subscriptions, recent analyses)

### 3.3 — Breadcrumb Navigation

- [ ] Implement dynamic breadcrumbs based on route structure
- [ ] Show current context: HR > Templates > Edit "Frontend Interview"

**Estimated effort:** 1 day

---

## Phase 4: Feature Polish (per-feature UI improvements)

### 4.1 — Templates

- [ ] Redesign template list — table with status badges, question count, created date
- [ ] Redesign template builder wizard — stepper with visual progress
- [ ] Add template preview before publishing
- [ ] Question editor — better UX for multiple choice options

### 4.2 — Interviews / Invitations

- [ ] Redesign invitations list — table with candidate name, template, status badge, score circle
- [ ] Interview review page — show AI analysis results inline (score, recommendation, per-question feedback)
- [ ] Candidate interview page — clean, focused UI for recording responses

### 4.3 — Candidates

- [ ] Redesign candidate search — filters sidebar + results grid/list toggle
- [ ] Candidate profile card — skills, experience level, interview history
- [ ] Invite modal — template selector + candidate details

### 4.4 — Companies

- [ ] Company list with member count, subscription status
- [ ] Company detail — member management, billing info link

### 4.5 — Users (Admin)

- [ ] User table — role badges, status, last login
- [ ] User detail — role management, suspension controls
- [ ] Stats dashboard — user growth chart (placeholder)

### 4.6 — Billing (new frontend pages)

- [ ] Subscription status page — current plan, usage meters, upgrade CTA
- [ ] Plan comparison page — free/plus/pro feature matrix
- [ ] Usage dashboard — interviews used/limit, analysis tokens

### 4.7 — Profile

- [ ] Redesign profile page — avatar upload, info form, security section
- [ ] Candidate profile — skills management with proficiency levels

**Estimated effort:** 3-5 days

---

## Phase 5: Testing

### 5.1 — Vitest Component Tests

- [ ] Test all React Query hooks (mock with MSW)
- [ ] Test form validation (template creation, invitation, profile)
- [ ] Test auth flow (middleware behavior, role guards)
- [ ] Test interview reducer (existing test, expand)
- [ ] Target: 50+ component/hook tests

### 5.2 — Playwright E2E Tests

- [ ] Setup Playwright config
- [ ] Auth flow: login → dashboard redirect by role
- [ ] HR flow: create template → add questions → publish → invite candidate
- [ ] Candidate flow: view invitations → start interview → submit responses
- [ ] Admin flow: user management → skill management
- [ ] Target: 20+ E2E scenarios

**Estimated effort:** 2-3 days

---

## Phase 6: Accessibility & i18n (polish)

### 6.1 — Accessibility Audit

- [ ] Run axe-core audit on all pages
- [ ] Fix color contrast issues (Light Professional should pass WCAG AA)
- [ ] Verify keyboard navigation on all interactive elements
- [ ] Add aria-labels to icon-only buttons
- [ ] Screen reader testing on key flows

### 6.2 — i18n Preparation

- [ ] Extract all hardcoded strings to constants/locale files
- [ ] Setup next-intl or react-i18next
- [ ] English locale file (complete)
- [ ] Russian locale file (structure only)

**Estimated effort:** 2 days

---

## Execution Order & Dependencies

```
Phase 0 (Theme)         ← FIRST, everything depends on this
  ↓
Phase 1 (Mock → API)    ← Can start after 0.1-0.2
  ↓
Phase 2 (React Query)   ← Can start in parallel with Phase 1
  ↓
Phase 3 (Routes)        ← After Phase 1 (needs real data for dashboards)
  ↓
Phase 4 (Polish)        ← After Phases 1-3 (needs real data + clean routes)
  ↓
Phase 5 (Testing)       ← After Phase 4 (test final components, not WIP ones)
  ↓
Phase 6 (a11y + i18n)   ← Last, polish pass
```

**Total estimated effort:** 12-16 days

---

## API Endpoint Coverage

### Already Connected (8/10 features)

| Feature          | API Module                  | React Query      |
| ---------------- | --------------------------- | ---------------- |
| Auth             | lib/api.ts (built-in)       | N/A (cookies)    |
| Templates        | lib/api/templates.ts        | use-templates.ts |
| HR-Candidates    | lib/api/candidate-search.ts | Direct calls     |
| Companies        | lib/api/companies.ts        | use-companies.ts |
| Skills           | lib/api/skills.ts           | use-skills.ts    |
| Candidate-Skills | lib/api/candidate-skills.ts | use-skills.ts    |
| Users            | lib/api/users.ts            | use-users.ts     |
| Profile          | lib/api/users.ts            | use-users.ts     |

### Need Migration (2/10 features)

| Feature    | API Module Exists           | Needs                               |
| ---------- | --------------------------- | ----------------------------------- |
| Interviews | lib/api/invitations.ts      | Replace mock with React Query hooks |
| Candidates | lib/api/candidate-search.ts | Replace mock with React Query hooks |

### New Frontend Pages Needed

| Page                     | Backend API                        | Status                          |
| ------------------------ | ---------------------------------- | ------------------------------- |
| Billing / Subscription   | GET /api/billing/subscription      | Backend ready, no frontend      |
| Billing / Usage          | GET /api/billing/usage             | Backend ready, no frontend      |
| Billing / Plans          | GET /api/billing/plans             | Backend ready, no frontend      |
| AI Analysis Review       | GET /api/v1/analysis/:invitationId | Backend ready, partial frontend |
| Notification Preferences | GET /api/preferences               | Backend ready, no frontend      |
