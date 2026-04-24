---
description: Launch the two-phase refactoring workflow — analysis first, then named transformations one at a time
argument-hint: <file path or function name>
---

Start the disciplined refactoring workflow for `$ARGUMENTS`, following Fowler's catalog and our [refactoring skill](.claude/skills/refactoring/SKILL.md).

## Workflow

### Phase 0 — Pre-flight checks

1. Confirm target exists: if `$ARGUMENTS` is a path, verify the file; if a function name, grep to locate.
2. Check test coverage for the target — if no tests cover it, STOP and tell user "add characterization tests first".
3. Run tests for the target service — baseline must be GREEN. If RED, fix tests before refactoring.
4. Confirm no in-flight PR is about to merge into this file (avoid pointless conflicts).

### Phase 1 — Analysis (no code changes)

Invoke the `refactoring-advisor` agent with `$ARGUMENTS` as target. Capture:

- File / function metadata: lines, complexity, cyclomatic, public methods.
- Code smells detected (prioritized by monorepo impact).
- Proposed transformations in order.
- Risk level and recommended split (1 PR vs N PRs).

Present the plan to the user. **Wait for explicit approval** before moving to Phase 2.

### Phase 2 — Transformations (one at a time)

For each transformation in the approved plan:

1. **Announce**: "Applying [Named refactoring] to <target>".
2. **Apply**: make the edit.
3. **Verify**: run targeted tests via background Agent (per [feedback_test_execution.md](~/.claude/projects/-Users-oleg-www-ai-video-interview/memory/feedback_test_execution.md)).
4. **On GREEN**: prompt user to commit with message template:

   ```
   refactor(<service>): <named-refactoring> — <target>

   Fowler catalog: <refactoring name>
   Target: <file/function>
   Behavior preserved: yes
   ```

5. **On RED**: revert the edit, report what broke, await user decision (fix forward risky; usually better to analyze why the refactoring broke the behavior).
6. **Pause** — move to next transformation only when user types "continue" / approves.

### Phase 3 — Cleanup

After all planned transformations:

- Run full test suite for the service.
- Run `/complexity-scan <service>` to confirm hard limits are now satisfied.
- Summary: what was applied, total diff, any remaining smells deferred to future work.

## Iron Rules

1. **One named transformation per commit.** Never batch.
2. **Tests GREEN after each step.** Revert, don't forward-fix, when red.
3. **No behavior change.** If you find yourself changing a test assertion, stop — behavior is changing, that's a separate task.
4. **Small steps.** 10 small refactorings safer than 1 big one.
5. **Stop anytime.** User can halt and commit partial progress at any step.

## Refactorings Available (Fowler Catalog)

Composing: Extract Function, Inline Function, Extract Variable, Inline Variable, Replace Temp with Query, Split Phase.

Moving: Move Function, Move Field, Slide Statements.

Organizing Data: Replace Primitive with Object (use our VOs or branded types), Encapsulate Field, Rename Variable / Function / Class.

Conditional: Decompose Conditional, Consolidate Conditional, Replace Nested Conditional with Guard Clauses, Replace Conditional with Polymorphism, Introduce Special Case.

API: Separate Query from Modifier, Parameterize Function, Remove Flag Argument, Preserve Whole Object, Replace Parameter with Query.

Inheritance: Replace Inheritance with Delegation, Pull Up / Push Down.

## Example

```
/refactor apps/interview-service/src/application/commands/complete-invitation/complete-invitation.handler.ts
```

→ triggers analysis via `refactoring-advisor`, you see plan, approve, then step-by-step application with tests between each.

## What NOT to do

- Don't rewrite — rename. Rewriting changes behavior.
- Don't apply refactorings in bulk silently.
- Don't skip the analysis phase.
- Don't refactor code about to be rewritten entirely.
