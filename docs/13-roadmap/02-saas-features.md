# 02 — SaaS Features & Ideas

> Features and ideas to transform this from a pet project into a production SaaS platform.
> Organized by business impact and implementation effort.

---

## Tier 1: Core Product Differentiators

### 1.1 Real-Time Video Recording & Playback

**Current**: Text-only responses. No actual video/audio capture.
**Proposed**: WebRTC-based recording with playback for HR review.

- Camera/microphone permissions with graceful fallbacks (audio-only, text-only)
- Chunked upload to MinIO via presigned URLs (no data through API Gateway)
- Recording preview before submission (re-record option)
- HR playback with timestamp sync to question/response timeline
- Thumbnail generation for interview cards
- Transcription via Groq Whisper for AI analysis enhancement

**Business value**: This IS the core product — without video, it's just a form builder.

### 1.2 Multi-Language Support

**Current**: English-only prompts, UI strings extracted but single-locale.
**Proposed**: Full i18n for UI + AI analysis in candidate's language.

- UI localization: Russian, English, German, Spanish (React i18n with `en.ts` pattern already started)
- LLM analysis with language-specific system prompts
- Language detection from candidate's responses (via Groq)
- Results presented in HR's preferred language (translation pass)
- Per-company language configuration

**Business value**: Opens European and CIS markets. ~60% of target customers are non-English.

### 1.3 Team Collaboration & Multi-Reviewer

**Current**: One HR creates template, one HR reviews results.
**Proposed**: Panel review with multiple evaluators.

- **Shared evaluations** — multiple HR reviewers score the same candidate
- **Evaluation templates** — standardized scorecard alongside AI analysis (manual + AI scores)
- **Comments & notes** — per-response threaded discussion between reviewers
- **@mentions** — notify colleagues about specific candidates
- **Consensus score** — average of all reviewer scores + AI score (configurable weights)
- **New role: Interviewer** — can only view assigned candidates, not manage templates/companies

**Business value**: Enterprise sales enabler. Panel interviews are standard in 80%+ of mid-to-large companies.

### 1.4 Candidate Experience Polish

- **Practice mode** — candidates rehearse without recording, see sample questions
- **Progress indicator** — "Question 3 of 8, ~12 min remaining"
- **Preparation tips** — AI-generated prep notes based on template questions
- **Mobile-first recording** — responsive video capture UI for phone interviews
- **Accessibility** — screen reader support, keyboard-only navigation, closed captions
- **Interview resume** — if browser crashes, candidate can resume from last answered question (requires `allowPause` feature)

**Business value**: Higher completion rates (industry average: 65% → target: 85%+), better candidate impression.

---

## Tier 2: Growth & Monetization Features

### 2.1 HR Analytics Dashboard

- **Funnel visualization**: Invited → Started → Completed → Analyzed → Hired
- **Time-to-hire tracking**: Days from invitation to hire decision
- **Score distribution**: Bell curve across candidates per position (radar charts)
- **Template effectiveness**: Which questions produce most differentiating scores
- **Comparative reports**: Side-by-side candidate comparison with radar charts
- **Export**: PDF/CSV reports for stakeholders who don't have platform access
- **Trending**: Score trends over time (is scoring getting stricter/lenient?)

### 2.2 ATS Integration (Applicant Tracking Systems)

- **Webhook outbound**: Push events to customer ATS (Greenhouse, Lever, Workday, BambooHR)
  - Events: candidate_invited, interview_completed, analysis_ready, candidate_recommended
  - HMAC-SHA256 signed payloads
- **API inbound**: Import job openings and candidates from ATS
- **iFrame embed**: Embed interview widget in external career pages
- **Zapier/Make integration**: Low-code automation for non-technical HR teams
- **CSV bulk import**: Upload candidate list for batch invitations

**Business value**: Fits into existing HR workflows, reduces adoption friction. #1 feature request in B2B SaaS.

### 2.3 Custom Branding (White-Label)

- **Company logo** on interview pages (already have `logoUrl` field)
- **Custom colors** — configurable accent color per company
- **Custom domain** — `interviews.company.com` via CNAME + TLS
- **Custom email templates** — company-branded notification emails
- **Remove platform branding** — "Powered by" footer configurable per plan

### 2.4 Advanced AI Features

- **Skill-based scoring** — match candidate answers against required skills from job description
- **Comparative ranking** — rank all candidates for a position by AI scores
- **Red flag detection** — flag concerning patterns (inconsistency, plagiarism markers, off-topic)
- **Sentiment analysis** — emotional tone of responses (confidence, stress, enthusiasm)
- **Answer similarity** — detect if candidate answers are copy-pasted from common sources
- **Custom scoring criteria** — HR defines own criteria (instead of fixed relevance/completeness/clarity/depth)
- **A/B testing** — compare different LLM models on same interviews, track quality

### 2.5 Interview Templates Marketplace

- **Public template library** — curated templates for common roles (Frontend Dev, Product Manager, Sales)
- **Community templates** — HR users share templates, rating system
- **AI template generator** — input job description, AI generates questions
- **Template versioning** — new version of template, keep history, compare performance
- **Question bank** — reusable questions across templates, tag-based organization

---

## Tier 3: Enterprise & Scale Features

### 3.1 Organization Management

- **Multi-tenant** — each company is a tenant with isolated data
- **Departments** — teams within a company, separate template access
- **Approval workflows** — template must be approved by manager before publishing
- **Audit log** — immutable log of all admin actions (who did what, when, with what result)
- **SSO integration** — SAML 2.0, OpenID Connect (Okta, Azure AD, Google Workspace)
- **Custom roles** — beyond admin/hr/candidate, define roles with granular permissions

### 3.2 Compliance & Data Protection

- **GDPR compliance** — right to erasure, data export, consent management
- **Data retention policies** — auto-delete recordings after configurable period (30/60/90/180 days)
- **Data residency** — choose storage region (EU, US, APAC) per company
- **Consent tracking** — candidate explicitly consents to AI analysis, video recording
- **Anonymization** — remove PII from analysis results on demand
- **SOC 2 Type II** readiness — audit trails, access controls, encryption at rest

### 3.3 Live Interview Mode

**Current**: Asynchronous only (candidate records at own pace).
**Proposed**: Real-time peer-to-peer video interview.

- WebRTC peer-to-peer with STUN/TURN servers
- HR watches candidate in real-time
- HR can ask follow-up questions (not just template questions)
- Real-time transcription via WebSocket + Whisper streaming
- AI analysis available immediately after session ends
- Recording saved for later review

### 3.4 API-First Platform

- **Public REST API** — full API access for enterprise integrations
- **API keys** — per-company API keys with rate limiting and scopes
- **Webhooks** — configurable event subscriptions with retry and DLQ
- **SDKs** — TypeScript, Python, Go SDKs for common integrations
- **GraphQL** — alternative to REST for flexible frontend queries

---

## Tier 4: Visionary / Experimental

### 4.1 AI Interview Copilot

- Real-time suggestions for HR during live interviews
- "Ask about X to probe deeper" based on candidate's previous answers
- Automatic follow-up question generation from AI analysis gaps

### 4.2 Candidate Insights

- **Career fit score** — how well candidate matches company culture (from response patterns)
- **Growth potential** — areas where candidate shows learning ability
- **Team fit analysis** — compare candidate's communication style against existing team

### 4.3 Marketplace & Network Effects

- **Talent pool** — candidates opt-in to be discovered by companies based on their interview scores
- **Skill verification** — AI-verified skills from interview responses (badge system)
- **Cross-company insights** — anonymized industry benchmarks (how does this candidate score vs. industry average?)

### 4.4 Voice & Emotion Analysis

- **Speech pace** — too fast, too slow, appropriate
- **Confidence markers** — tone stability, hesitation patterns
- **Language quality** — grammar, vocabulary richness, filler words
- Requires audio processing pipeline (FFmpeg + ML model)

---

## Implementation Priority Matrix

```
                    LOW EFFORT          HIGH EFFORT
                ┌─────────────────┬─────────────────┐
   HIGH IMPACT  │ 1.2 Multi-lang  │ 1.1 Video       │
                │ 2.3 Branding    │ 1.3 Multi-review │
                │ 1.4 Candidate UX│ 2.2 ATS          │
                │ 2.5 Templates   │ 3.3 Live mode    │
                ├─────────────────┼─────────────────┤
   LOW IMPACT   │ 2.4 AI features │ 3.1 Multi-tenant │
                │ 3.4 Public API  │ 3.2 Compliance   │
                │ 2.1 Analytics   │ 4.x Experimental │
                └─────────────────┴─────────────────┘
```

**Recommended MVP scope** (first paying customers):

1. Video recording + playback (1.1)
2. Multi-language UI (1.2)
3. HR Analytics dashboard (2.1)
4. Email notifications (via Notification Service)
5. Basic billing (Free + Paid plans)

---

_Created: 2026-03-27_
