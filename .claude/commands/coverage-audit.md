---
description: Run test coverage for a service (or all) and identify gaps vs target
argument-hint: [service] (optional — default: current context)
---

Run and analyze test coverage for `$ARGUMENTS` (or the service you infer from the current conversation context).

## Procedure

1. **Determine target**:
   - If `$ARGUMENTS` is a service name (`api-gateway`, `user-service`, `interview-service`, `ai-analysis-service`, `billing-service`, `notification-service`, `web`, `shared`), run for that service.
   - If `$ARGUMENTS` is `all`, run sequentially for all services.
   - If empty, infer from the most recent conversation context (the service you've been working on).

2. **Run tests with coverage** via a background Agent (per [feedback_test_execution.md](~/.claude/projects/-Users-oleg-www-ai-video-interview/memory/feedback_test_execution.md) — tests run via background Agent, main thread monitors).

   ```bash
   cd apps/<service> && npm run test:cov
   ```

3. **Parse output**:
   - Overall coverage: lines, statements, branches, functions.
   - Per-file coverage breakdown from Jest's text-summary reporter.
   - Identify files with coverage below targets.

4. **Classify files by layer**:
   - `src/domain/**` → target: 90% lines, 100% state-machine branches.
   - `src/application/**` → target: 80% lines.
   - `src/infrastructure/**` → target: 60% lines (covered by integration tests).
   - Other → target: 80% service overall.

5. **Report gaps**:

   ```
   ## Coverage Report — <service>

   Overall: <X>% lines, <Y>% branches  [target: 80%]

   ### Below target by layer
   - Domain (target 90%):
     - path/to/aggregate.ts — 76% (missing: line 142-158 — error path)
   - Application (target 80%):
     - path/to/handler.ts — 65% (missing: rollback branch)
   - Infrastructure (target 60%):
     - path/to/repo.ts — 42% (no integration test found)

   ### Critical paths with < 95%
   - <list if any>

   ### Untested new code (vs last commit)
   - <list files changed in last commit with 0% on new lines>

   ### Suggested next tests
   1. <file>:<range> — <what branch/scenario to cover>
   2. ...
   ```

6. **Output verdict**:
   - ✅ `All targets met`
   - ⚠️ `Below target in N files — improvable`
   - ❌ `Below hard floor — must fix before merge`

## What NOT to do

- Don't run e2e tests here (separate cost profile — use `/test-service --e2e`).
- Don't modify tests yourself — identify gaps, let the user decide what to add.
- Don't treat 100% as the goal — target is specified per layer, diminishing returns beyond.

## Example

```
/coverage-audit billing-service
```
