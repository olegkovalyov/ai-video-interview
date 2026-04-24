---
description: Scan a service (or the whole monorepo) for files/functions that exceed hard-limit thresholds
argument-hint: [service|all] (optional)
---

Scan `$ARGUMENTS` (default: `all`) for violations of our hard limits from [CLAUDE.md](CLAUDE.md#hard-limits-monorepo-wide).

## Thresholds

| Metric               | Hard limit                      |
| -------------------- | ------------------------------- |
| Function length      | > 30 lines                      |
| Function parameters  | > 4                             |
| Nesting depth        | > 3                             |
| File length          | > 500 lines (aggregates exempt) |
| Class public methods | > 10                            |

## Procedure

1. Determine scope:
   - If `$ARGUMENTS` is a service name → `apps/<service>/src/`.
   - If `all` or empty → all `apps/*/src/` and `packages/*/src/`.

2. **File length scan** (quickest pass):

   ```bash
   find <scope> -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" \
     | xargs wc -l | sort -rn | awk '$1 > 300'
   ```

   Flag files > 500 lines (CRITICAL) and 300-500 (WATCH). Note that `*.aggregate.ts` are exempt from the 500-line rule but still flag for review.

3. **Function length scan** — parse TS files and extract:
   - Exported function / method declarations.
   - Count lines from signature to closing `}`.
   - Flag > 30 lines.

   Use a simple AST scan with `ts-morph` if available, or grep-based heuristic:

   ```bash
   grep -n "^\s*\(async \)\?\(function\|[a-zA-Z_]*(.*):.*{\)" <file>
   ```

4. **Parameter count scan**:
   - Any function with > 4 params.
   - Include constructor params for classes (`@Inject` count).

5. **Nesting depth scan**:
   - Max indentation in any function body.
   - Flag if > 3 levels (12+ spaces indent or 3+ tabs).

6. **Report**:

   ```
   ## Complexity Scan — <scope>

   ### File length violations
   - apps/interview-service/src/application/commands/complete-invitation/complete-invitation.handler.ts — 612 lines (> 500)
   - apps/billing-service/src/infrastructure/stripe/stripe.service.ts — 389 lines (300-500 watch)

   ### Function length violations
   - handler.ts:execute() — 67 lines (hard limit 30)
   - mapper.ts:toEntity() — 38 lines

   ### Parameter count violations
   - CheckoutService.constructor — 7 injected deps (limit 4-5)

   ### Nesting depth violations
   - validator.ts:validateCascade() — depth 5 (limit 3)

   ### Overall monorepo summary
   Files scanned: N
   Violations: critical X, watch Y
   ```

7. **Verdict**:
   - ✅ `No hard-limit violations`
   - ⚠️ `<N> watch items` (not blocking, consider refactor)
   - ❌ `<N> critical violations` (should address via `/refactor` or `refactoring-advisor` agent)

## Integration

- For each critical violation, suggest invoking `refactoring-advisor` agent with that file as target.
- For file-level violations where split is unclear, suggest `decomposition-advisor` agent.

## What NOT to do

- Don't auto-refactor — report only.
- Don't fail on aggregate files > 500 lines blindly — note the exemption and flag as review-worthy, not violation.
- Don't count test files in aggregate stats by default (they're legitimately long due to many `it()` blocks) — report separately if asked.

## Example

```
/complexity-scan interview-service
```
