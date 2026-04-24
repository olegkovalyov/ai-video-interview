# Frontend Surface — AI Video Interview Platform

> A self-contained brief you can drop into **Claude Design** (or any other
> design-generation tool) to produce mockups, component libraries, or full
> page redesigns. Use the whole document for a system-wide redesign or pick
> sections for focused work (e.g. "Billing screens only").
>
> Last updated: 2026-04 · Phase 1 complete, Phase 2 in planning.

---

## 1. Product at a glance

**One-liner:** async, AI-scored video interviewing for hiring teams.

**What it does:**

1. **HR** (recruiter) builds an interview template — a set of questions (text,
   multiple choice, technical, behavioral).
2. **HR** invites a candidate by email with a deadline.
3. **Candidate** takes the interview asynchronously in their browser —
   records video/audio answers and/or picks multiple-choice answers.
4. **AI** (Groq LLM under the hood) scores each answer, produces an overall
   recommendation: `hire / consider / reject`, with strengths and weaknesses.
5. **HR** reviews the analysis side-by-side with the candidate's responses,
   then approves or rejects — triggering a branded email to the candidate.

**Business model:** SaaS with freemium tiers (Free / Plus / Pro) billed via
Stripe. Quota enforcement on interviews-per-month, templates, team members.

**Who uses it:** small-to-mid hiring teams (5–50 person companies) that can't
afford dedicated recruiters for phone-screening and want to reduce bias
through consistent AI scoring.

---

## 2. User roles & their jobs-to-be-done

### HR (primary paying user)

- Keep a library of interview templates that match open roles.
- Invite candidates fast (1-click from search, email autofill).
- Compare candidates objectively via AI scores.
- Make a hire/no-hire call with an audit trail.
- Manage team, billing, and usage.

### Candidate (free user, conversion surface)

- Receive invitation, understand what's asked and how long it takes.
- Take the interview in a low-anxiety environment (pause, timer visibility).
- See their own results and feedback after HR's decision (not before —
  prevents candidate self-screening).

### Admin (internal / platform owner)

- Manage users, roles, skill taxonomy, companies across the tenant.
- See platform-wide health (not in scope for design; mostly tables).

---

## 3. Existing pages (built, live in master)

All authenticated pages live under a persistent **sidebar + header** shell.
Marketing and auth pages have their own minimal layouts.

### 3.1 Marketing / Public

| Route         | Purpose                                                    | Notes                                                  |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| `/` (landing) | Hero, value prop, social proof, CTA to `/register`.        | Indigo gradient, "AI interviews" positioning.          |
| `/pricing`    | Plan cards (Free $0, Plus $29, Pro $99) + FAQ + final CTA. | CTAs now route to Stripe checkout for auth'd HR users. |
| `/about`      | Team/mission page.                                         | Static copy.                                           |

### 3.2 Auth

| Route          | Purpose                                               |
| -------------- | ----------------------------------------------------- |
| `/login`       | Redirects to Keycloak OIDC.                           |
| `/register`    | Keycloak signup.                                      |
| `/callback`    | Handles OIDC return, issues httpOnly cookies.         |
| `/select-role` | Post-signup: pending users pick HR or Candidate role. |

### 3.3 HR workspace

| Route                 | Purpose                                                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard`          | Role-redirect (HR → `/hr/interviews`; candidate → `/candidate/dashboard`).                                                                                                   |
| `/hr/interviews`      | Interview template CRUD. List of templates with status badges (draft/active/archived). Inline actions: edit, archive, publish.                                               |
| `/hr/interviews/[id]` | Template detail + question builder with drag-and-drop reorder (dnd-kit). Supports open/multiple-choice/technical/behavioral questions.                                       |
| `/hr/candidates`      | Candidate search + invite. Filter by skills, status. Primary action: "Invite to interview" opens `InviteModal`.                                                              |
| `/hr/candidates/[id]` | Single candidate view — interview history, skill profile, past decisions.                                                                                                    |
| `/hr/companies`       | Company management (one HR user can have multiple companies). Cards with edit/delete.                                                                                        |
| `/hr/review/[id]`     | **The decision screen.** Side-by-side: AI analysis (score, strengths, weaknesses, recommendation) + candidate's actual responses. Approve/Reject buttons with a note dialog. |

### 3.4 Candidate workspace

| Route                     | Purpose                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/candidate/dashboard`    | "My Interviews" — invitation list with status (pending/in progress/completed/expired) + decision badges.                                               |
| `/candidate/results/[id]` | **Read-only** AI results for own interview: overall score, summary, strengths/weaknesses, per-question feedback. Shown only after HR approves/rejects. |
| `/candidate/skills`       | Self-assessment — candidate rates their own skills on a scale for better matching.                                                                     |

### 3.5 Interview-taking flow (own layout, no sidebar)

| Route                                              | Purpose                                                                                                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/interview/[invitationId]`                        | Pre-interview brief: template title, question count, estimated duration, allow-pause toggle. **Start Interview** button.                                                        |
| Question-by-question UI (same route, state-driven) | Question text, answer input (textarea or multi-choice), optional per-question timer, progress bar ("3 of 10"), **Submit & Next**. **Finish Early** button for early completion. |
| Completion screen                                  | "Thanks! Your responses have been submitted." Optionally shows "Analysis in progress" spinner.                                                                                  |

### 3.6 Profile (shared)

| Route                              | Purpose                                                                                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/profile`                         | Personal info: name, avatar (MinIO upload), bio, phone, timezone, language.                                                                                      |
| `/profile/security`                | Change password (via Keycloak), active sessions (future).                                                                                                        |
| `/profile/notifications`           | Master toggles (email/in-app) + 11 per-template toggles (invitations, analysis ready, decisions, billing, etc.).                                                 |
| `/profile/billing` (HR/admin only) | **New.** Current plan card with status badge + period, usage bars (interviews/templates/team), invoices list, Stripe customer portal button, cancel/resume flow. |
| `/profile/skills`                  | Candidate-only. Same as `/candidate/skills`.                                                                                                                     |

### 3.7 Admin (mostly tables)

| Route               | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `/admin/users`      | User list, role management, disable/enable.        |
| `/admin/skills`     | Skill taxonomy (categories, skills, aliases).      |
| `/admin/interviews` | Platform-wide view of invitations (ops debugging). |

---

## 4. Cross-cutting UI building blocks (already exist)

These are reusable components / patterns that should stay consistent in any
redesign:

- **Sidebar navigation** with role-based items (admin sees admin section, HR
  sees interviews/candidates/companies, candidate sees dashboard/skills).
- **App header** with search (planned), notification bell (with unread badge
  - dropdown), user avatar + menu.
- **Notification bell** — real-time via Server-Sent Events. Dropdown shows
  last 10 notifications, "mark all read" action.
- **Toasts** via Sonner for non-blocking feedback (success/error/info).
- **Dialogs** for confirmations (approve/reject candidate, cancel subscription,
  delete template).
- **Status badges** — semantic colors: success (green), warning (amber),
  error (red), info (blue). Used for interview status, decision, plan status,
  invoice status.
- **Score visualization** — colored numeric score (75+ green, 50–74 amber,
  <50 red) with supporting bar or ring.
- **Quota exceeded modal** — when a Free-plan HR tries to exceed quota, a
  branded upgrade prompt opens (Stripe pricing CTA).

---

## 5. Planned / Phase 2 features (design-first candidates)

These are known features without final UX. Good targets for Claude Design.

### 5.1 Interview recording + proctoring (high-value, underspecified UX)

- Webcam + microphone recording during interview (currently text-only).
- Optional: screen-share for technical questions.
- Proctoring signals: tab-switch detection, multiple faces, audio drop-outs
  (shown to HR in review, not to candidate).
- Upload progress + "saved locally" fallback if network fails.
- **UX tension:** make it feel professional but not surveillance-y.

### 5.2 Comparison view (HR workflow)

- Pick 2–5 completed candidates for the same template, see them side-by-side.
- Columns: score, recommendation, strengths/weaknesses, time-to-complete.
- Filterable/sortable. Exportable to PDF/CSV.
- **Design challenge:** dense data without feeling like a spreadsheet.

### 5.3 Bulk actions

- On `/hr/candidates`: multi-select → bulk invite to same template.
- On `/hr/interviews` (template list): bulk archive.
- Needs keyboard shortcuts (shift-click range select) for HR speed.

### 5.4 PDF/CSV export

- Per-candidate report (AI analysis + responses) as branded PDF.
- Cross-candidate CSV for pipeline analysis in external tools.

### 5.5 Team members & roles within a company

- Currently 1 HR = 1 company. Plus/Pro plans allow 5 / unlimited seats.
- Need: invite colleague by email → they become HR for the same company.
- Roles: owner (pays), member (can invite, can't see billing).

### 5.6 Template library / marketplace

- Curated starter templates by role (Frontend, Backend, Designer, PM).
- HR can clone, modify, publish.

### 5.7 Real-time collaboration on review

- Multiple HRs comment on a candidate's review asynchronously.
- "@mention" teammates, thread discussion under each question.

### 5.8 Scheduled jobs UX (admin/HR visible surface)

- Cancel-at-period-end finalization notifier.
- Past-due subscription warning banner (7-day grace).
- "Interview about to expire" reminder email (already in backend).

---

## 6. Design constraints

### Tone & positioning

- **Professional but warm.** Candidates are anxious; HRs are time-poor.
- **Trust signals** matter: AI scores with explanations, audit trail of
  decisions, clear privacy statements ("your responses are only visible to
  the hiring team").
- **Avoid:** hiring-tech jargon (ATS, pipeline, funnel), gamified elements,
  aggressive upgrade prompts.

### Brand direction (current)

- **Primary color:** indigo (`#6366f1` family — primary-500 to primary-700).
- **Accent gradient:** indigo → purple on hero, pricing "popular" highlight.
- **Neutrals:** Tailwind CSS 4 default gray scale. Light mode polished,
  dark mode present but secondary.
- **Typography:** default Next.js font stack (Geist-like, grotesque sans).
- **Illustration style:** minimal, Lucide icons everywhere. No stock photos.

### Technical constraints on design

- **Shadcn/ui + Radix primitives** — any component you design must be
  expressible as shadcn composition OR be a justified custom addition.
- **Tailwind CSS 4** — no CSS-in-JS, no external component libraries beyond
  Radix.
- **Mobile second-class:** HR workflows desktop-first, candidate flows must
  work on phone (they take interviews on whatever they have).
- **No heavy animations** — Framer Motion only for dialogs/transitions, no
  scroll-hijacking.
- **Accessibility:** WCAG 2.1 AA — keyboard navigation, proper ARIA, 4.5:1
  contrast ratios.

### Anti-patterns to avoid

- "Generic SaaS aesthetic" (purple-blob gradients on every hero, Lottie
  confetti on success, 3D isometric illustrations).
- Dark-pattern pricing (fake urgency, "most users pick Pro" manipulations).
- Dashboard bloat — don't dump 12 widgets on the landing screen.
- Imitating ATS competitors (Greenhouse, Lever) — they look enterprise-heavy
  and we want to feel lighter.

---

## 7. Suggested starting points for Claude Design

In priority order of value-for-effort:

1. **`/hr/review/[id]` redesign** — the decision screen is where HR spends
   the most time and where AI meets human judgment. A better layout
   directly improves conversion and perceived product quality.
2. **`/profile/billing`** — just shipped; would benefit from a second pass
   for visual polish before users see it.
3. **`/candidate/dashboard`** — first impression for candidates, currently
   functional but generic.
4. **Interview-taking flow** — the most emotionally-loaded experience in
   the whole app; deserves bespoke UX, not reused dashboard patterns.
5. **Comparison view** (net-new) — no existing UI to constrain, good
   sandbox for exploration.

---

## 8. Non-goals for the redesign

- Marketing site overhaul (landing page is fine for now).
- Admin screens (internal tool, utility > aesthetic).
- Onboarding wizard (separate initiative, Phase 3).
- Mobile app (planned but not this cycle).
