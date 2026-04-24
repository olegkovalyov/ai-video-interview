---
description: Run EXPLAIN ANALYZE on a SQL query via MCP and interpret the plan for performance issues
argument-hint: <service> "<SQL>"
---

Analyze the query `$ARGUMENTS` on the specified service's database using the appropriate postgres MCP.

## Procedure

1. Parse `$ARGUMENTS` to extract:
   - Service name: one of `user`, `interview`, `analysis`, `billing`, `notification`.
   - SQL string (may be multi-line, may be wrapped in quotes).

2. Route to the correct MCP:
   - `user` → `postgres-user`
   - `interview` → `postgres-interview`
   - `analysis` → `postgres-analysis`
   - `billing` → `postgres-billing`
   - `notification` → `postgres-notification`

3. Run `EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT) <SQL>` via the MCP.

4. Read the plan and report:

   ### Top-level observations
   - Total planning time + execution time.
   - Seq Scan vs Index Scan per table.
   - Rows removed by filter (bad — means index not selective enough).
   - Hash / Merge / Nested Loop joins — size of hash, number of iterations.
   - Sort nodes — external (on-disk) vs in-memory.
   - Buffers: shared hit / read / dirtied — high reads = cold cache or missing index.

   ### Flags to raise
   - **Seq Scan on > 10k rows** → probably missing index.
   - **Filter removes > 90%** of rows scanned → composite/partial index opportunity.
   - **Nested Loop with outer > 100 rows** → may need Hash Join / better statistics.
   - **Sort method: external merge** → `work_mem` too small or query needs index-backed ordering.
   - **Execution time > 1s** → needs attention.
   - **Buffers: read >> hit** → cold cache, data not in memory.

5. Suggest concrete fixes:
   - `CREATE INDEX CONCURRENTLY idx_<table>_<cols> ON <table> (<cols>);` if missing.
   - Query rewrite (push predicate down, remove unnecessary joins).
   - Statistics: `ANALYZE <table>;` if row estimates are off.
   - Consider keyset pagination instead of OFFSET.

6. End with verdict:
   - ✅ `Plan is OK` — fast, using indexes, no smells.
   - ⚠️ `Plan acceptable but improvable` — mostly fine; list 1-2 suggestions.
   - ❌ `Plan has critical issues` — list the blockers with suggested fixes.

## Safety

- **Read-only queries only** (SELECT, EXPLAIN). If the query contains `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE`/`DROP`/`ALTER`, refuse and warn the user to use migration tooling.
- Don't wrap destructive queries in EXPLAIN ANALYZE — even then the actual statement executes.

## Example usage

```
/query-analyze interview "SELECT * FROM invitations WHERE hr_user_id = 'abc' ORDER BY created_at DESC LIMIT 20"
```
