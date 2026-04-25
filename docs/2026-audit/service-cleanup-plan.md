# Service Cleanup Plan — user-service → all backend + web

> **Purpose**: step-by-step algorithm for driving every service in the monorepo to **0 ESLint errors / 0 warnings / full green test stack**, with Boy Scout refactoring applied per file. This document is **self-contained** — if the conversation has been compacted, reading this + current `git log` is enough to resume work accurately.

## Current Status (update as we go)

| #   | Service              | ESLint errors  | ESLint warnings | Tests                           | Commit SHA | Status                            |
| --- | -------------------- | -------------- | --------------- | ------------------------------- | ---------- | --------------------------------- |
| 1   | **user-service**     | 147 → **0** ✅ | 629 → **0** ✅  | 🟢 605 unit / 231 int / 109 e2e | `64d5487`  | **Phase 5 done** — ratchet locked |
| 2   | notification-service | —              | —               | —                               | —          | ⏳ next                           |
| 3   | api-gateway          | —              | —               | —                               | —          | ⏳                                |
| 4   | ai-analysis-service  | —              | —               | —                               | —          | ⏳                                |
| 5   | billing-service      | —              | —               | —                               | —          | ⏳                                |
| 6   | interview-service    | —              | —               | —                               | —          | ⏳                                |
| 7   | web                  | —              | —               | —                               | —          | ⏳                                |
| 8   | packages/shared      | —              | —               | —                               | —          | ⏳                                |

**Order rationale**: smallest/simplest first (notification, api-gateway) → gain confidence and patterns → then medium (ai-analysis, billing) → largest last (interview-service, web). Each one teaches patterns for the next.

## Philosophy (non-negotiable)

1. **Commits are atomic by category, PRs squashed on merge if desired**. Multiple commits per service in a branch; final merge is up to the user.
2. **Tests must be green after every commit**. If a commit breaks tests — revert, diagnose, fix, re-commit. Never push red.
3. **Boy Scout rule**: while fixing ESLint issue in a file, apply named refactorings from the Fowler catalog **only where natural**. Don't force refactoring into every line touched.
4. **Surgical fix + observation**: if a larger refactoring is warranted but outside current scope, add `// TODO(#issue):` and move on. Don't balloon PRs.
5. **Never mix refactoring with behavior change in the same commit**. If a fix changes runtime behavior (even subtly), it belongs in its own commit with explicit description.
6. **No `--fix` without test stack**. Every auto-fix run is followed by unit tests immediately. Integration + e2e at category checkpoints.

## Per-Service Workflow

### Phase 0 — Pre-flight checks (5 min)

```bash
cd apps/<service>
npx eslint . --format json 2>/dev/null | node -e "..."  # see 'Diagnostics' snippets below
npm run test                    # unit tests — MUST be green before starting
```

If unit tests are red: **stop**. Either the baseline is broken (separate fix needed) or there's an environmental issue. Don't start cleanup on a broken baseline.

### Phase 1 — Auto-fix + regression sweep (15–30 min)

```bash
npx eslint . --fix               # auto-fixes prettier, imports, some sonarjs, some unicorn
git diff --stat                  # review scope of changes
grep -rn "> 0" src/              # CRITICAL: unicorn/explicit-length-check is disabled in config
                                 # but scan for leftover `x > 0` from earlier runs on string-typed enums
npm run test                     # unit tests MUST stay green
```

**If tests break**: first suspect is `unicorn/explicit-length-check` (already disabled) or a similar silent auto-fix. Diff the affected file; revert the suspect change; run tests again. See "Known Hazards" below.

### Phase 2 — Errors → 0 (category by category)

Run the diagnostics helper to see error breakdown:

```bash
npx eslint . --format json 2>/dev/null | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const errorRules = {};
let total = 0;
for (const file of data) {
  for (const msg of file.messages) {
    if (msg.severity === 2) {
      const rule = msg.ruleId || 'unknown';
      errorRules[rule] = (errorRules[rule]||0)+1;
      total++;
    }
  }
}
console.log('Total errors: ' + total);
for (const [r,c] of Object.entries(errorRules).sort((a,b)=>b[1]-a[1])) console.log('  ' + r.padEnd(50) + String(c).padStart(3));
"
```

Process categories in **this order** (quick → hard):

#### 2.1 Quick wins (~1–2h)

- `@typescript-eslint/no-unused-vars` + `sonarjs/unused-import` + `sonarjs/no-unused-vars` + `sonarjs/no-dead-store` — mostly mechanical.
  - Unused imports → delete line.
  - Unused params → prefix `_` (keeps signature stable for interface compatibility).
  - Unused local vars: if it's a `const x = await something()` and side effect is intended, drop `const x =`. Otherwise delete the line.
  - Unused declarations with side effects — check the author's intent (may be test isolation setup).

- `@typescript-eslint/no-require-imports` (3–4 typically): replace `const x = require('mod')` with ES import at top of file. For dynamic / jest-mocked: use `jest.requireMock<typeof import('mod')>('mod')` with explicit type parameter.

- `sonarjs/no-undefined-argument`: remove redundant trailing `undefined` in function calls (ESLint is right — if it says "redundant", it is).

- `unicorn/prefer-ternary`: rewrite `if/else` as ternary only when the branches are clearly parallel.

#### 2.2 Style / rule toggles (~30 min)

- `unicorn/filename-case` on migrations → already disabled via config file override. If it triggers elsewhere, check if renaming is safe (imports, DI tokens, DB migration names — **never rename migration files**, they are in `migrations` table).

- `sonarjs/todo-tag` → **globally disabled** (redundant; we use `TODO(#issue):` convention).

- `sonarjs/no-skipped-tests` + `@typescript-eslint/ban-ts-comment` → if skip/nocheck is intentional for a tracked issue, add `// eslint-disable-next-line ...` with explicit `// TODO(#xxx):` rationale. Don't silently accept.

#### 2.3 Critical runtime-risk rules (~2–3h)

These often represent real potential bugs:

- `@typescript-eslint/no-floating-promises` — add `await`, `void`, or `.catch(err => logger.error(...))`. If fire-and-forget is intentional (e.g., Kafka subscription in `onModuleInit`), use `void` prefix with a comment explaining why.

- `@typescript-eslint/no-non-null-assertion` (`!`): replace with explicit guard. Pattern:

  ```ts
  // BAD
  const group = grouped.get(key)!;
  group.skills.push(item);
  // GOOD
  let group = grouped.get(key);
  if (!group) {
    group = { ... };
    grouped.set(key, group);
  }
  group.skills.push(item);
  ```

  Or use `.flatMap(x => x.thing ? [transform(x.thing)] : [])` instead of `.filter(x => x.thing).map(x => transform(x.thing!))`.

- `no-console` — replace with `LoggerService`. Exception: bootstrap code before logger construction (use `process.stdout.write` / `process.stderr.write` with `// eslint-disable-next-line no-console` + rationale).

- `@typescript-eslint/restrict-template-expressions` — wrap `${maybe}` with `String(maybe)` or narrow first.

- `sonarjs/deprecation` — if migration to new API is risky (e.g., JaegerExporter → OTLP), add `// eslint-disable-next-line sonarjs/deprecation -- TODO(#migration):` with explicit rationale; do migration separately.

- `sonarjs/slow-regex` — add length check before regex, use bounded quantifiers. For email validation: `/^[^\s@]{1,64}@[^\s@.]{1,253}\.[^\s@]{2,63}$/` (RFC 5321 limits).

- `sonarjs/pseudo-random` — replace `Math.random()` with `crypto.randomUUID()` for identifiers. `Math.random` OK for non-security randomness like shuffling.

- `unicorn/no-process-exit` — in CLI entry (`main.ts` bootstrap catch): add `// eslint-disable-next-line unicorn/no-process-exit -- service bootstrap; exit code is orchestrator signal`. Elsewhere: throw instead.

#### 2.4 `sonarjs/different-types-comparison` (~1–2h)

Often signals real bugs. Typical patterns:

- `description?.trim() !== this._description` where `description: string | null` and `this._description: string | null` — optional chaining returns `undefined` when input is `null`, so comparison is always `true`. **This causes false-positive change events**. Fix: normalize through a helper:

  ```ts
  private static normalizeNullableField(value: string | null): string | null {
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }
  ```

- `entity === null || entity === undefined` where type is `T | undefined` — drop the `=== null` check; use `!entity`.

- `value === null || value === undefined || value === ''` — use `value == null || value === ''` (double equals catches both; ESLint allows `== null` idiom).

Each case requires judgment — don't apply mechanically. The check may be defensive for runtime inputs that TS doesn't track.

#### 2.5 `@typescript-eslint/no-explicit-any` (~3–5h — largest category)

Approach by category of `any`:

- **NestJS Logger compatibility** (`message: any, ...optionalParams: any[]`): replace with `unknown`. All internal usage is `String(message)` so `unknown` works.

- **TypeORM entity enum columns** (`entity.role = vo.value as any`): use `entity.role = vo.value as UserEntity['role']` — typed through the entity definition.

- **Readonly tuple `.includes()`** (`VALID_X.includes(value as any)`): use `(VALID_X as readonly string[]).includes(value)` — preserves runtime behavior, satisfies types.

- **Kafka event payloads**: introduce an explicit interface + type guard. `JSON.parse` returns `unknown`, then narrow via `isUserAuthenticatedEvent(event)`.

- **Express multer file** (`file: any`): replace with `Express.Multer.File`.

- **NestJS Observables** (`Observable<any>`): replace with `Observable<unknown>` in interceptors.

- **Repository `params: any[]`**: replace with `params: unknown[]` (SQL driver accepts any serializable, unknown is closer to truth).

- **Catch clause** (`error: any`): use `error: unknown`, narrow in body:

  ```ts
  } catch (error) {
    logger.error('op.failed', {
      error: error instanceof Error ? error.message : String(error),
      ...
    });
  }
  ```

- **Response mapper input** (`toSkillDto(skill: any)`): use a union of all real input types, or a narrower shape type. Cast through `Record<string, unknown>` for dynamic-shape inputs when you know you're mapping read models.

- **Metadata / jsonb columns** (`Record<string, any>`): replace with `Record<string, unknown>`. All downstream must narrow before use — this is the enforcement.

**After this category**: run ESLint again. `no-unsafe-*` warning count drops by 50–80% as a cascade (typing one `any` resolves many downstream `no-unsafe-assignment/member-access/call/return`).

### Phase 3 — Test checkpoint

```bash
npm run test                        # unit — must pass
npm run test:integration            # uses testcontainers Postgres
npm run test:e2e -- --forceExit     # full HTTP stack
```

If any layer is red: diagnose, fix, re-run. **Do not commit on red.**

### Phase 4 — Commit #N (errors → 0)

Stage the service's changes. Recommended commit message template:

```
refactor(<service>): eliminate ESLint errors (<N> → 0) + Boy Scout refactorings

Errors resolved (by category):
- Unused vars/imports/dead-stores (~X)
- no-explicit-any (~Y)
- different-types-comparison (~Z)
- Remaining small rules (~W)

Boy Scout refactorings:
- <list notable extractions, renames, pattern introductions>
- <list any real bugs found and fixed (e.g., false-positive events)>

Tests: N unit / M integration / K e2e — all green.

Warnings remaining: W (down from V) — tracked for subsequent commits.
```

### Phase 5 — Warnings → 0 (next commits in the same branch)

Diagnostic:

```bash
npx eslint . --format json 2>/dev/null | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const warnRules = {};
let total = 0;
for (const file of data) {
  for (const msg of file.messages) {
    if (msg.severity === 1) {
      const rule = msg.ruleId || 'unknown';
      warnRules[rule] = (warnRules[rule]||0)+1;
      total++;
    }
  }
}
console.log('Total warnings: ' + total);
for (const [r,c] of Object.entries(warnRules).sort((a,b)=>b[1]-a[1])) console.log('  ' + r.padEnd(50) + String(c).padStart(3));
"
```

Process in this order (biggest leverage first):

#### 5.1 `no-unsafe-*` cascade (~2–4h)

Most should already be gone from Phase 2.5 (fixing `any` removes downstream `no-unsafe-*`). Remaining ones are usually:

- Third-party library return types that are broad.
- Our own interfaces that accept `unknown` but should accept a specific shape.
- Kafka/HTTP boundary where runtime validation is needed.

Solutions:

- Narrow with type guards at the boundary.
- Introduce typed DTO + class-validator (for HTTP) or Zod (for less strict boundaries).
- Use `satisfies` operator for config objects.

Commit message: `refactor(<service>): type-safe cascade (no-unsafe-* → 0)`.

#### 5.2 `max-params` → Parameter Object (~2–4h)

Pattern:

```ts
// BAD
export async function createInvitation(
  templateId: string,
  candidateEmail: string,
  hrUserId: string,
  companyName: string,
  expiresAt: Date,
  language: Language,
): Promise<Invitation> { ... }

// GOOD — Introduce Parameter Object
export interface CreateInvitationParams {
  templateId: string;
  candidateEmail: string;
  hrUserId: string;
  companyName: string;
  expiresAt: Date;
  language: Language;
}

export async function createInvitation(
  params: CreateInvitationParams,
): Promise<Invitation> { ... }
```

For NestJS handler execute signatures — the command/query class IS the parameter object, so this is usually fine. For constructor DI — if > 4 dependencies injected, consider splitting the class (SRP smell).

Commit message: `refactor(<service>): introduce parameter objects (max-params → 0)`.

#### 5.3 `max-lines-per-function` → Extract Function (~5–15h)

**Most effortful category**. Each violation is a rich refactoring opportunity.

For each function > 30 lines:

1. **Identify seams** — places where the function switches level of abstraction.
   - "Validate input" block
   - "Load data" block
   - "Apply business rule" block
   - "Persist" block
   - "Publish event" block
   - "Build response" block

2. **Extract Function** for each seam with an intention-revealing name.

3. **Check cohesion** — if extracted helpers share 3+ pieces of state, they might belong on a new class (Extract Class).

4. **Run tests** after every 2–3 extractions — never extract a big chunk without verifying.

**Exception**: aggregate `reconstitute` / `create` factory methods that construct a lot of value objects from flat data — these are legitimately long. If splitting hurts readability, add `// eslint-disable-next-line max-lines-per-function -- factory method: atomic by nature` with rationale.

Commit message: `refactor(<service>): extract methods from god functions (max-lines-per-function → 0)`.

#### 5.4 `complexity` + `sonarjs/cognitive-complexity` + `max-depth` (~2–4h)

Patterns:

- **Switch on type** (if/else chain on status/role/plan) → **Replace Conditional with Polymorphism** (Strategy pattern) or table-driven dispatch (`Record<Key, Handler>` lookup).
- **Nested conditionals** → **Guard Clauses** (early returns).
- **Long boolean expressions** → **Decompose Conditional** (extract named predicates).

Commit message: `refactor(<service>): reduce cyclomatic/cognitive complexity`.

#### 5.5 Remaining warnings (~1–2h)

- `@typescript-eslint/require-await` — if function must be async for interface compatibility (NestJS OnModuleInit, etc.), keep but add `// eslint-disable-next-line` with rationale. Otherwise make it sync.
- `@typescript-eslint/unbound-method` — use arrow function or `.bind(this)` where the method is passed as a callback.
- Miscellaneous — fix on case-by-case basis.

### Phase 6 — Raise warn → error

Once all warnings are 0 for the service, tighten the rules **per-service** (NOT globally — other services still have warnings):

Create/update `apps/<service>/eslint.config.mjs`:

```js
// @ts-check
import nestConfig from "@repo/eslint-config/nest";

const base = nestConfig({ tsconfigRootDir: import.meta.dirname });

export default [
  ...base,
  {
    // Service has been brought to 0/0 — treat warnings as errors now.
    rules: {
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/unbound-method": "error",
      "max-lines-per-function": [
        "error",
        { max: 30, skipComments: true, skipBlankLines: true, IIFEs: true },
      ],
      "max-params": ["error", 4],
      "max-depth": ["error", 3],
      "max-classes-per-file": ["error", 1],
      complexity: ["error", 10],
      "sonarjs/cognitive-complexity": ["error", 10],
    },
  },
];
```

After this override, new PRs touching this service will break CI if they introduce regressions. Ratchet locked.

Commit message: `refactor(<service>): raise warn→error, lock 0/0 baseline`.

### Phase 7 — Final test stack + push

```bash
npm run test
npm run test:integration
npm run test:e2e -- --forceExit
git push origin develop
```

Service done. Move to next in the list.

## Known Hazards (auto-fix regressions)

These auto-fixes have caused regressions; they are disabled in `packages/eslint-config/nest.js`:

| Rule                            | What happens                                                                                                                                 | Disabled location              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `unicorn/explicit-length-check` | Turns `if (entity.size)` into `if (entity.size > 0)` on **string-typed** enum columns — silently breaks runtime (string > 0 = always false). | `nest.js` unicorn tuning block |

**If new hazards emerge**: add the rule to the unicorn tuning block or to the relevant file-specific override with a comment explaining why.

## Boy Scout Refactoring Checklist (per file touched)

While fixing an ESLint issue in a file, scan for **opportunities** (don't force):

- Function > 30 lines → candidate for Extract Function
- ≥ 4 parameters → candidate for Introduce Parameter Object
- Deep nesting (>3) → candidate for Replace Nested Conditional with Guard Clauses
- Primitive `string` for ID → candidate for branded type (`UserId`, `CompanyId`)
- `switch` on type code / status string → candidate for Replace Conditional with Polymorphism
- 3+ optional fields where combinations matter → candidate for Discriminated Union
- `any` → concrete type / generic with constraint
- Anemic aggregate (only getters, logic in "Service") → move behavior into aggregate (Information Expert)
- `logger.info(\`\${}\`)` string interpolation → structured log with fields
- `catch { console.log(e) }` → structured error log with trace context

**Apply what's cheap and in-scope**. Record everything else as `TODO(#...)` for future commits.

## Metrics of Success (per service)

- [ ] 0 ESLint errors
- [ ] 0 ESLint warnings
- [ ] All `warn` rules raised to `error` in per-service override
- [ ] Unit tests green
- [ ] Integration tests green
- [ ] E2E tests green (if present)
- [ ] No `// eslint-disable-next-line` without `// TODO(#issue):` rationale
- [ ] No `@ts-ignore` / `@ts-nocheck` without explicit issue reference
- [ ] No `any` in production code
- [ ] No `console.*` outside documented bootstrap exceptions
- [ ] All domain files pass `boundaries/element-types` rule (no framework imports in `domain/`)

## Monorepo-level Finalizer (after all services done)

Once all 6 backend services + web + packages/shared are at 0/0 with `error`-level rules locked in:

1. Move critical rules from per-service override back to `nest.js` as `error` globally. Delete per-service overrides.
2. Consider adding `eslint-ratchet` or `betterer` to enforce "no new warnings in future PRs" as belt-and-suspenders insurance.
3. Document the new invariant in root `CLAUDE.md`: "all code is strict by default; any `eslint-disable` requires a tracked issue".
4. (Optional) Add Stryker for domain-layer mutation testing to validate test quality.

## When to Defer / Stop

It is fine and sometimes correct to stop cleanup and return to features:

- Critical production issue → drop everything, fix it.
- A feature with real deadline → defer the current service's cleanup, note where you left off in this file.
- Stuck in yak-shaving (refactoring for > 30 min without tests passing) → commit `WIP:` with detailed note, `git reset --soft`, redo in smaller steps.

**Update this document** with service status + sticky issues when pausing. The goal is for anyone (including future-you post-compact) to resume cleanly.

## Reference — skills & agents to consult

- **Clean Code rules** → [.claude/skills/clean-code/SKILL.md](../../.claude/skills/clean-code/SKILL.md)
- **Refactoring catalog (Fowler)** → [.claude/skills/refactoring/SKILL.md](../../.claude/skills/refactoring/SKILL.md)
- **Design patterns (GoF + GRASP + PoEAA)** → [.claude/skills/design-patterns/SKILL.md](../../.claude/skills/design-patterns/SKILL.md)
- **TypeScript advanced** → [.claude/skills/typescript-advanced/SKILL.md](../../.claude/skills/typescript-advanced/SKILL.md)
- **Observability** → [.claude/skills/observability/SKILL.md](../../.claude/skills/observability/SKILL.md)
- **Testing pyramid** → [.claude/skills/testing-pyramid/SKILL.md](../../.claude/skills/testing-pyramid/SKILL.md)

**Review agents** (invoke per-file when unsure):

- `code-quality-reviewer` — clean code + TypeScript safety
- `refactoring-advisor` — two-phase named transformations
- `test-coverage-reviewer` — testing pyramid + coverage
- `observability-reviewer` — structured logging + OTel
- `postgres-query-reviewer` — SQL / index / migration safety
- `pattern-advisor` — GoF / GRASP / PoEAA pattern selection
- `security-reviewer` — XSS, SQL injection, auth bypass, secret exposure
- `ddd-checker` — layer separation, aggregate invariants

**Slash commands**:

- `/query-analyze <service> "<SQL>"` — EXPLAIN ANALYZE via MCP
- `/coverage-audit <service>` — test coverage gaps
- `/complexity-scan <service>` — files/functions exceeding limits
- `/refactor <file>` — two-phase refactoring workflow
