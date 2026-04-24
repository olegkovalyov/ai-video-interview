# UX features to adopt from Claude Design redesign

> Feature-level description of UX improvements we plan to pull from the
> Claude Design prototype ([docs/redesign/](../redesign/)). Intentionally
> product-focused — no technical details. Each feature answers:
> _what the user sees, what problem it solves, how the journey changes_.
>
> Work through them one by one when ready to implement.

---

## 1. Dimension scores (break down the overall AI score)

**Who it's for:** HR (reviewing candidates)

**What it is**

Today AI returns a single overall score (e.g. "85") plus a text summary, strengths and weaknesses. The proposed change: AI **also** returns four sub-scores on well-known hiring dimensions:

- **Technical** — how well the candidate handled technical questions
- **Communication** — clarity, structure, articulation
- **Problem solving** — multi-step reasoning, tradeoff analysis
- **Role fit** — alignment with the specific role's rubric

Each dimension gets its own numeric score, a short one-line rationale (e.g. _"React, real-time"_ for Technical), and a progress bar.

**Why it matters**

Right now HR sees "85" and has to trust it blindly. Two candidates with the same overall score can be wildly different: one is a strong technical hire with communication gaps, the other is a polished communicator with shallow tech. Dimensions let HR **see the shape of the signal**, not just the magnitude, and explain their decision to teammates.

**User journey**

Before: HR opens review → sees 85 → reads summary → decides. Decision anchored in a single number.
After: HR opens review → sees 85 + four dimensions with rationales → notices _Technical 89, Communication 82_ → reads summary → decides with calibrated expectations.

**Visible in:** HR review page, candidate results page (candidate sees their own dimensions), comparison view (as the matrix rows).

---

## 2. Proactive quota awareness

**Who it's for:** HR

**What it is**

Three coordinated surfaces that keep HR aware of their plan limits _before_ they hit them:

- **Sidebar usage meter** — a small bar at the bottom of the sidebar: "Plus plan · 38 / 100 interviews · resets May 1". Always visible while working.
- **Inline hint in the Invite modal** — when HR is about to send an invitation, a subtle note says "This will use 2 of your 62 remaining interviews this month".
- **"Approaching limit" warning** on the Billing page — once usage crosses ~80% of any quota (interviews, templates, team members), an amber badge with "Approaching limit" appears on that specific meter.

**Why it matters**

Currently HR discovers quota exhaustion at the worst possible moment: they click "Send invitation" and get a 402/Upgrade modal. This feels like a trap. Proactive surfaces turn it into a **predictable budget** users manage, not a landmine.

**User journey**

Before: HR sends invitation → unexpected Upgrade modal → annoyance → friction on upgrade decision.
After: HR sees usage climbing in sidebar → invite modal shows "2 of 5 remaining" → HR decides whether to send now or upgrade first. No surprises.

**Visible in:** Sidebar (always), Invite modal (on open), Billing page (when usage > 80%).

---

## 3. Pre-flight check before starting the interview

**Who it's for:** Candidate

**What it is**

A brief technical readiness screen **before** the first question appears, showing three live indicators:

- **Microphone** — green check when input is detected, or a warning if silent
- **Camera** — green check when a face is visible, warning if not
- **Lighting** — green "Good lighting" when the image is well-lit, warning if too dark

The candidate clicks "I'm ready" only when all three are green (or chooses to proceed despite warnings).

**Why it matters**

The biggest cause of bad interviews is technical: muted mic, covered camera, backlit face. Candidate is the most anxious user in the whole product — they start answering a hard question not knowing if they're actually being recorded. 90 seconds into the answer they realize something's wrong and panic. A 10-second pre-flight removes that anxiety entirely.

**User journey**

Before: Candidate lands on interview page → clicks Start → question appears → records → hopes it worked.
After: Candidate lands → sees three green checks (or fixes one warning) → confidently clicks "I'm ready" → records with trust in the tech.

**Visible in:** Interview-taking flow, shown once at the very start.

---

## 4. "Saving locally" indicator during recording

**Who it's for:** Candidate

**What it is**

A small status line near the recording controls that shows, in real time, that the candidate's response is being **preserved locally in the browser**, not just streamed to a server:

- "Saving locally" while recording
- "Saved" after each answer is submitted
- "Saved locally — will sync when back online" if the network drops

**Why it matters**

Candidates routinely lose connectivity during long interviews (moving between rooms, bad wifi, etc.). If they believe the entire recording is lost, they either give up or retake — which ruins the integrity of the interview. A visible local-save signal tells them: "you can keep going, your answers are safe, we'll sync when possible." It turns a fatal failure into a minor inconvenience.

**User journey**

Before: Wifi hiccups → candidate sees error → fear of losing 10 minutes of answers → confusion about whether to retry.
After: Wifi hiccups → UI stays calm → "Saved locally — will sync" → candidate keeps answering → data syncs when connection returns.

**Visible in:** Interview-taking flow, near the recording UI.

---

## 5. Candidate hero invitation card

**Who it's for:** Candidate

**What it is**

The first screen after candidate login becomes **focused on the one thing they're here to do**: take their pending interview. Replaces the current generic list with a prominent card featuring:

- Bold interview title and company name
- Four quick facts: question count, estimated duration, deadline, whether pause is allowed
- One big "Start interview" CTA
- A small privacy reassurance line below (see Feature 6)

Past interviews are relegated to a secondary section below.

**Why it matters**

Currently the candidate lands on a grid of status-badged cards and has to figure out which one to click. For candidates with a single pending invitation (the common case), this adds cognitive load for zero benefit. A hero card **reduces the entire landing page to a single decision**: start or not.

**User journey**

Before: Candidate logs in → sees 4 cards in a grid → scans badges → finds the pending one → clicks → reads details → starts.
After: Candidate logs in → single big card with all the info → one click to start.

**Visible in:** Candidate dashboard (the primary post-login screen for candidates).

---

## 6. Privacy reassurance inline

**Who it's for:** Candidate

**What it is**

A small, unobtrusive line of text on the candidate's invitation card and on the pre-interview screen:

> "Your responses are only visible to the Acme Labs hiring team. [Privacy details →]"

The company name is filled in dynamically. The "Privacy details" link opens a short modal or dedicated page explaining what's recorded, where it's stored, who sees it, and how long it's kept.

**Why it matters**

The single biggest source of candidate anxiety that we never address: "where does my recording go?". It's also the #1 reason candidates drop out of video interviews in the industry. One sentence, well-placed, removes that barrier at the exact moment it appears in the candidate's mind.

**User journey**

Before: Candidate stares at "Start recording" button, wonders who will see this, hesitates, maybe abandons.
After: Candidate sees the reassurance line, optionally clicks for details, proceeds confidently.

**Visible in:** Candidate dashboard hero card, pre-interview screen, interview-taking top bar.

---

## 7. Emotional status copy for past interviews

**Who it's for:** Candidate

**What it is**

Status badges on past interviews switch from neutral system language to **candidate-perspective emotional framing**:

| Old (system-centric)  | New (candidate-centric)                       |
| --------------------- | --------------------------------------------- |
| "Completed"           | "Analyzing responses" (while AI runs)         |
| "Completed, analyzed" | "Under review" (after AI, before HR decision) |
| Decision: approved    | "Hired 🎉"                                    |
| Decision: rejected    | "Not this time"                               |
| "Expired"             | "Expired" (unchanged)                         |

Plus a helper line like "Up to 5 min" next to "Analyzing responses" to set time expectations.

**Why it matters**

Labels are UX. "Completed" to a candidate feels like their interview is sitting in a void. "Analyzing responses" tells them something is happening. "Not this time" is gentler than a clinical "Rejected" — it opens the door to reapplying later. These are 15 minutes of copy work with outsized emotional impact.

**User journey**

Before: Candidate sees "Completed" on their interview from 3 days ago → wonders "did they forget me?".
After: Candidate sees "Under review" → knows decision is pending → waits with less anxiety.

**Visible in:** Candidate dashboard, candidate results page, email subject lines.

---

## 8. Split HR note into internal vs candidate-facing

**Who it's for:** HR (and indirectly, candidates — this prevents a bug)

**What it is**

Currently the HR decision has a single "note" field. When HR approves/rejects, that note:

1. Becomes part of the internal audit trail (visible to teammates)
2. **Is also included in the email sent to the candidate**

This dual-use is risky: HR can accidentally write _"Strong signal but let's double-check the testing gap with Jamie"_ intending it as internal context, and the candidate receives it in their rejection email.

Proposal: **two distinct fields**:

- **Internal note** (mandatory for audit): freeform context visible only to the hiring team. Supports team tags ("Follow-up round", "Strong culture fit"). Autosaves as you type.
- **Message to candidate** (optional): what actually goes in the email. Defaults to a polite template the HR can customize.

The UI makes the distinction obvious with labels and a subtle visual boundary.

**Why it matters**

This is a **safety-critical UX change**, not a polish item. Current design makes it too easy to send the wrong thing to the wrong audience. Also: splitting unlocks better internal documentation without compromising candidate communication.

**User journey**

Before: HR types a thoughtful internal analysis → realizes it's going to the candidate → has to self-censor or risk miscommunication.
After: HR writes freely in Internal note → optionally writes a separate polished Message to candidate → both get saved to the right place.

**Visible in:** HR review page (decision section), notification emails to candidate.

---

## 9. Time-to-complete as a visible signal

**Who it's for:** HR (primarily in comparison view, secondarily on individual review)

**What it is**

Alongside the AI scores, display **how long the candidate took to complete the interview** — both as a single value (e.g. "21:25") and, in comparison view, as a column alongside scores.

**Why it matters**

Time-to-complete is a **real signal HR already uses mentally** but we don't expose it. A candidate who scored 82 in 15 minutes vs. one who scored 85 in 45 minutes — different profiles, potentially different hiring decisions. Showing this explicitly makes comparisons more honest and gives HR a signal beyond pure AI score.

**Not** about gamification or efficiency worship — just transparency about data we already have.

**User journey**

Before: HR compares two candidates by score → can't tell who struggled vs who breezed through.
After: HR sees "Alice: 85 / 21 min" vs "Bob: 82 / 42 min" → notices Alice's time efficiency → factors into decision.

**Visible in:** HR review page (in candidate meta), comparison view (as a column).

---

## 10. One retake per question

**Who it's for:** Candidate (and indirectly HR, who gets higher-quality responses)

**What it is**

Candidates can **re-record exactly one time per question** during the interview. A small "Re-record" button becomes available after submitting an answer (for a short window, e.g. before moving to next question). After using it once, it's disabled for that question.

The template builder has a toggle: "Allow retakes (1 per question)" — defaults ON, HR can disable for high-stakes assessments.

**Why it matters**

Candidates are anxious. They garble a sentence, forget a key point, or get interrupted. Currently, a single flub kills the whole answer and contributes a bad score to the overall. A retake is a **safety net** that reduces drop-off and improves the quality of data AI gets to score. It's the difference between "anxious 50-minute ordeal" and "you can breathe, fix a mistake, and move on".

**User journey**

Before: Candidate fumbles Q3 → can't do anything → continues with lower confidence → score reflects the fumble.
After: Candidate fumbles Q3 → hits Re-record → delivers a clean answer → score reflects actual capability.

**Visible in:** Interview-taking flow (button appears briefly after each answer), template builder (toggle).

---

## 11. Reminder scheduling when inviting

**Who it's for:** HR (configures), Candidate (receives)

**What it is**

When HR sends an invitation, the Invite modal includes a field for **automatic reminder timing**:

- "Send reminder: 1 day before deadline" (default)
- Options: 3 days / 1 day / 4 hours / no reminder

If the candidate hasn't started the interview by that offset, they get an email nudge: "Reminder — your interview for Senior Frontend at Acme Labs is due in 1 day. [Start now →]".

The reminder system exists in our backend as an email template; we just don't schedule it per-invitation today. Making it a first-class field in the invite modal closes the loop.

**Why it matters**

Industry data says reminder emails increase interview completion rate by **10–15%**. That's revenue directly — fewer expired invitations means fewer repeat invitations which count against quota. It's also less work for HR: they set it and forget it instead of chasing candidates manually.

**User journey**

Before: HR invites → candidate sits on the invitation for 6 days → deadline passes → invitation expires → HR has to manually re-invite or follow up.
After: HR invites with "1 day before" reminder → candidate gets automated nudge on day 6 → completes on day 7 → no manual chase.

**Visible in:** Invite modal (HR-facing), automated email to candidate.

---

## Summary: rough sequencing

The 11 features cluster into three natural groups:

1. **Quick wins (copy + layout changes only)** — #5, #6, #7, #9. Each is a day or less. High visible impact, no backend.
2. **Coordinated medium changes (new UI + small backend work)** — #2, #3, #4, #8, #10, #11. Each is 2-5 days. Meaningful trust and conversion gains.
3. **Big foundational changes (LLM prompt + schema + UI)** — #1 (dimension scores). Biggest lift, biggest product lift. Do it when there's dedicated focus, not in spare moments.

Ordering by dependency, I'd suggest going roughly: **copy changes first** (warm up UX vocabulary), then **HR note split** (safety fix, shouldn't wait), then **quota awareness trio** (coherent whole), then **pre-flight + saving locally** (candidate confidence), then **retakes + reminders** (completion rate levers), and finally **dimension scores** (standalone deep work).

But we'll decide feature-by-feature when we get there.
