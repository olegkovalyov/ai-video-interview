# User-Service Canonical Patterns — Reference for All Backend Services

> **Status**: user-service is the **reference implementation** for the AI Video Interview monorepo as of commit `ff74cb9` (2026-04-25). Every backend service that follows is expected to converge on the patterns described here unless there is a documented reason to deviate. When in doubt: copy the pattern from user-service.
>
> **How to use this doc**: when adding/refactoring a service, scan the table of contents, jump to the relevant section, follow the recipe. The "Adoption checklist" at the end is the minimum bar for parity.
>
> **What this doc replaces**: scattered decisions across PR descriptions, commit messages, and the cleanup plan. If anything here conflicts with `service-cleanup-plan.md` or `CLAUDE.md`, this doc is canonical — update the others.

## Table of Contents

1. [Layer Separation (DDD)](#1-layer-separation-ddd)
2. [Aggregate Patterns](#2-aggregate-patterns)
3. [Value Object Patterns](#3-value-object-patterns)
4. [Domain Exception Pattern](#4-domain-exception-pattern)
5. [Application Service Pattern](#5-application-service-pattern)
6. [CQRS Handler Pattern](#6-cqrs-handler-pattern)
7. [Repository Patterns](#7-repository-patterns)
8. [Outbox Pattern](#8-outbox-pattern)
9. [Observability Stack](#9-observability-stack)
10. [Test Structure & Conventions](#10-test-structure--conventions)
11. [NestJS Module Patterns](#11-nestjs-module-patterns)
12. [Migration Conventions](#12-migration-conventions)
13. [ESLint Ratchet (locked rules)](#13-eslint-ratchet-locked-rules)
14. [Adoption Checklist for New Services](#14-adoption-checklist-for-new-services)

---

## 1. Layer Separation (DDD)

Three layers, strict downward dependency only:

```
infrastructure  →  application  →  domain
```

| Layer             | Owns                                                                                                                    | Forbidden imports                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `domain/`         | Aggregates, value objects, domain events, repository interfaces, exceptions                                             | NestJS, TypeORM, kafkajs, anything from `application/` or `infrastructure/` |
| `application/`    | Commands, queries, handlers (CQRS), DTOs, application services, ports (interfaces)                                      | TypeORM, kafkajs, anything from `infrastructure/`                           |
| `infrastructure/` | TypeORM entities + repositories, controllers, Kafka producers/consumers, BullMQ workers, mappers, filters, interceptors | (no constraints — implements all the interfaces)                            |

**Mechanical rule**: a `grep -r "from '@nestjs"` inside `src/domain/` must return zero matches. Same for `from 'typeorm'`.

**Domain tests** are the most valuable: pure functions, no mocks, fastest feedback. Aim for 90% coverage on `domain/`.

---

## 2. Aggregate Patterns

### 2.1 Constructor + factory methods

```typescript
export class User extends AggregateRoot {
  // private constructor blocks ad-hoc instantiation
  private constructor(props: UserProps) { super(props); }

  // creates a NEW aggregate; emits UserCreatedEvent
  public static create(input: CreateUserInput): User { ... }

  // rebuilds from persistence (no events emitted)
  public static reconstitute(props: UserProps): User { ... }
}
```

`create()` validates inputs (via VO factories), emits domain events. `reconstitute()` trusts persisted state and skips event emission.

### 2.2 Per-field update helpers (Phase 5.3.D decision)

We tried a generic `applyOptionalUpdate<T>(...)` helper. It violated `max-params: 4` and obscured intent. **Replaced with per-field helpers**:

```typescript
private applyBioChange(bio: string | null | undefined): boolean { ... }
private applyPhoneChange(phone: string | null | undefined): boolean { ... }
private applyTimezoneChange(tz: string | null | undefined): boolean { ... }
```

Each helper:

- Takes one input field
- Returns `boolean` (whether state changed) — caller aggregates these to decide whether to emit event
- Stays under 30 lines (max-lines ratchet)
- Has 1 parameter (well under max-params)

**Trade-off accepted**: more lines than a generic helper, but each helper is self-documenting and individually testable.

### 2.3 Three-state VO update

For value-object-typed fields (e.g., `CompanySize`, `ProficiencyLevel`):

| Caller passes                  | Aggregate behaviour                       |
| ------------------------------ | ----------------------------------------- |
| `null`                         | Clear the field (set to null)             |
| `VO instance`                  | Replace the field if not equal to current |
| `undefined` (or current value) | No-op                                     |

This pattern is explicit in `Company.updateSize`, `CandidateProfile.updateSkillProficiency`, etc. Rationale: the difference between "user sent null" and "user didn't send anything" is real (PATCH vs explicit clear).

### 2.4 Invariant guards at the top

Every mutating method starts with guards:

```typescript
public suspend(reason: string, by: string): void {
  this.ensureNotDeleted();      // throws UserDeletedException
  this.ensureNotSuspended();    // throws AlreadySuspendedException
  // ... main logic, single level of indentation
}
```

Guard clauses keep main logic unindented. Avoid nested `if` checks scattered through the method.

### 2.5 Defensive collection access

```typescript
public get skills(): readonly CandidateSkill[] {
  return [...this.props.skills];   // copy, not reference
}
```

Aggregate's internal collections are never exposed by reference. Callers can't mutate them externally; the aggregate stays the only writer.

---

## 3. Value Object Patterns

### 3.1 Anatomy

```typescript
export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  public static create(raw: string): Email {
    if (!raw || raw.length > 255) throw new InvalidEmailException(raw);
    if (!EMAIL_REGEX.test(raw)) throw new InvalidEmailException(raw);
    return new Email({ value: raw.toLowerCase().trim() });
  }

  public get value(): string {
    return this.props.value;
  }
}
```

- Private constructor + static `create(...)` factory.
- All validation in factory; once constructed, the VO is valid.
- Normalize at construction time (lowercase, trim) so equality is robust.
- Equality via base `ValueObject<T>.equals()` (deep `props` comparison).

### 3.2 Enum-backed VOs

For finite domains (`UserStatus`, `UserRole`, `ExperienceLevel`):

```typescript
export class UserStatus extends ValueObject<UserStatusProps> {
  public static active(): UserStatus { return new UserStatus({ value: 'active' }); }
  public static suspended(): UserStatus { ... }
  public static deleted(): UserStatus { ... }

  public isActive(): boolean { return this.props.value === 'active'; }
  public isSuspended(): boolean { return this.props.value === 'suspended'; }
}
```

Named factories + type guards. Avoid raw string comparisons in callers.

---

## 4. Domain Exception Pattern

### 4.1 Static `code` + `httpStatus` per class

Established in Phase 5.3.F. Replaces try/catch + string-matching `error.message.includes('not found')` (which was a hidden API contract).

```typescript
export class UserNotFoundException extends DomainException {
  public static readonly code = "USER_NOT_FOUND";
  public static readonly httpStatus = 404;

  constructor(userId: string) {
    super(`User ${userId} not found`);
  }
}
```

### 4.2 Filter is table-driven

`DomainExceptionFilter.catch()`:

1. Walk `exception.constructor` prototype chain.
2. Read `code` and `httpStatus` static fields.
3. Map to HTTP response: `{ statusCode, error: code, message }`.

No `instanceof` chain. Adding a new exception class = declare two static fields. Filter doesn't need updating.

### 4.3 PG error translation lives in Application Services

Catch `QueryFailedError` with `code === '23505'` (unique violation) inside the Application Service and rethrow as a domain exception (e.g., `CompanyAlreadyExistsException`). PG SQLSTATE never leaks to the HTTP layer.

```typescript
// CompanyCreationService
private static isPgUniqueViolation(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && (error as { code?: unknown }).code === '23505';
}
```

### 4.4 Granularity rule

Each distinct domain failure mode = its own exception class. No generic `DomainException('user not found')` — that disconnects HTTP status from domain error type. Examples:

- `UserNotFoundException` → 404
- `UserAlreadyExistsException` → 409
- `CandidateSkillNotFoundException` → 404 (not 400 — explicit fix from 5.3.F)

---

## 5. Application Service Pattern

Established in Phase 5.2 + 5.3.E. **One Application Service per use case**, not per aggregate.

### 5.1 Anatomy

```typescript
@Injectable()
export class UserUpdateService {
  constructor(
    @Inject("IUserRepository") private readonly userRepo: IUserRepository,
    private readonly eventBus: EventBus,
    @Inject("IOutboxService") private readonly outbox: IOutboxService,
    @Inject("IUnitOfWork") private readonly uow: IUnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async update(input: UpdateUserInput): Promise<User> {
    // 1. Load
    const user = await this.loadUser(input.userId);
    // 2. Apply
    this.applyProfileChanges(user, input);
    // 3. Persist atomically (aggregate + outbox event in one tx)
    const eventId = await this.persistAtomically(user, input);
    // 4. Publish internal events post-commit
    this.publishInternalEvents(user);
    // 5. Schedule Kafka publishing post-commit
    await this.outbox.schedulePublishing([eventId]);
    return user;
  }

  // private helpers: loadUser, applyProfileChanges, persistAtomically, ...
}
```

### 5.2 Naming convention

`<Aggregate><Action>Service` for write services:

- `UserCreationService.create()`
- `UserUpdateService.update()`
- `CompanyDeletionService.delete()`
- `CandidateSkillAdditionService.add()`
- `SkillCreationService.create()`

For multi-step orchestrations (e.g., role selection emits user + candidate-profile events): named after the _initiating_ concept — `RoleSelectionService.select()`.

### 5.3 Input/Output types

Each service exports `XxxInput` interface alongside the class:

```typescript
export interface UpdateUserInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  bio?: string | null;
  phone?: string | null;
  // ... only fields the use case actually consumes
}
```

Keeps service signature stable as the underlying command DTO evolves.

### 5.4 Transaction boundary

The `IUnitOfWork.execute(async tx => { ... })` wraps:

- Aggregate save (`repo.save(aggregate, tx)`)
- Outbox event save (`outbox.saveEvent(type, payload, aggregateId, tx)`)

Outbox save MUST come **after** repo save inside the same transaction (PG row exists before its outbox event references it). For deletes: outbox save **before** repo delete (payload must capture state before the row is gone).

`outbox.schedulePublishing(eventIds)` is called **after** the UoW commits (BullMQ job creation outside the DB tx).

### 5.5 Multiple deps tolerance

Application services have 3-5 deps (repo + eventBus + outbox + uow + logger). This violates `max-params: 4`. Accept with `// eslint-disable-next-line max-params` and a comment explaining "this set of deps is the use-case scope, not a SRP smell".

---

## 6. CQRS Handler Pattern

After Phase 5.3.E, **command handlers are thin proxies** to Application Services. Logic lives in services; handlers exist only to satisfy `@nestjs/cqrs` registration.

```typescript
@Injectable()
@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(private readonly userUpdate: UserUpdateService) {}

  execute(command: UpdateUserCommand): Promise<User> {
    return this.userUpdate.update({
      userId: command.userId,
      firstName: command.firstName,
      lastName: command.lastName,
      bio: command.bio,
      phone: command.phone,
      timezone: command.timezone,
      language: command.language,
    });
  }
}
```

Rules:

- One dependency: the corresponding Application Service.
- `execute()` is a single statement (return + map command fields to input).
- No try/catch. Exceptions propagate to the global filter.
- No logging in the handler. Service is responsible.

**Why this layering**: the handler is the boundary between CQRS framework and pure application code. Keeping it thin means the service is testable without `@nestjs/cqrs` infrastructure (no `Test.createTestingModule` needed for service spec).

---

## 7. Repository Patterns

### 7.1 Read vs Write split

Two distinct interfaces, two implementations:

- **Write** (`IUserRepository`, `ICompanyRepository`): returns domain aggregates. Used by Application Services.
- **Read** (`IUserReadRepository`, `ISkillReadRepository`): returns flat read models (plain objects). Used by Query Handlers.

Read repositories bypass aggregate reconstitution + mappers — direct entity → ReadModel mapping. Faster, fewer joins, query-shape aligned with UI needs.

### 7.2 Filter helpers (Phase 5.3.C decision)

When a repository method has 3+ filter conditions, extract `applyXxxFilters(query, filters)`:

```typescript
private applyUserFilters(
  query: SelectQueryBuilder<UserEntity>,
  filters?: UserListFilters,
): SelectQueryBuilder<UserEntity> {
  if (filters?.search) query.andWhere('...', { search: `%${filters.search}%` });
  if (filters?.status) query.andWhere('user.status = :status', { status: filters.status });
  if (filters?.role)   query.andWhere('user.role = :role',     { role:   filters.role });
  return query;
}
```

DRY between `list()` and `count()`. Each method becomes 5-10 lines.

### 7.3 SqlClauses + bindings (raw SQL queries)

When TypeORM QueryBuilder is awkward (complex `HAVING`, multi-mode searches), use raw SQL via `dataSource.query<T>()` plus a structured clause-builder:

```typescript
interface SqlClauses {
  conditions: string[];
  params: unknown[];
  paramIndex: number;
}

interface SpecificSkillsBindings {
  skillCountParam: number;
  limitParam: number;
  offsetParam: number;
}
```

Build clauses by mutating `SqlClauses`, bundle 3+ param indices into a `Bindings` struct (Parameter Object pattern, satisfies `max-params: 4`).

### 7.4 Repository never imports domain logic

Mappers do the conversion. Repository just calls `mapper.toEntity(aggregate)` / `mapper.toDomain(entity)`. Don't put validation or business logic inside repositories.

### 7.5 Read-side service may compose multiple repos

`TypeOrmCandidateProfileQueryService` injects three TypeORM repositories + a mapper + DataSource (5 deps). This is a CQRS read-side legitimate exception; mark with `// eslint-disable-next-line max-params` and comment explaining it composes denormalized projections.

---

## 8. Outbox Pattern

### 8.1 saveEvent inside UoW

```typescript
await this.uow.execute(async (tx) => {
  await this.userRepo.save(user, tx);
  return await this.outbox.saveEvent(
    USER_EVENT_TYPES.UPDATED,
    payload,
    user.id,
    tx, // same tx
  );
});
```

`saveEvent` returns the `eventId`. After the UoW commits, the caller calls `outbox.schedulePublishing([eventId])` to enqueue a BullMQ job.

### 8.2 Order matters

- **Create / update**: aggregate save BEFORE outbox save (FK validity).
- **Delete**: outbox save BEFORE delete (payload captured from live row).

Tests assert this order explicitly: see `company-deletion.service.spec.ts` "should execute outbox save BEFORE delete".

### 8.3 Observability columns (Phase observability v2)

The `outbox` table carries `trace_id`, `parent_span_id`, `correlation_id`, `user_id` — captured at saveEvent time, restored at publish time. See [§9](#9-observability-stack).

### 8.4 BullMQ retry policy

- Job attempts: `OUTBOX_CONFIG.RETRY_ATTEMPTS` (3).
- Backoff: exponential, 2s base.
- Max retries → `handlePublishFailure` returns `false`, error swallowed (legacy behaviour preserved). Failed events stay in DB with `status=FAILED` for inspection.

### 8.5 Stuck-event scheduler

`OutboxSchedulerService` polls every 5 seconds for `status=PENDING` events (in case a BullMQ job was lost) and every minute for `status=PUBLISHING` rows that haven't progressed (worker died mid-publish).

---

## 9. Observability Stack

Reference implementation as of commit `ff74cb9` (2026-04-25). See [§14](#14-adoption-checklist-for-new-services) for adoption recipe.

### 9.1 Three channels, one context

| Channel             | Tool                   | What it shows                                   |
| ------------------- | ---------------------- | ----------------------------------------------- |
| Distributed tracing | OpenTelemetry → Jaeger | Span graph: who called whom, latency per hop    |
| Structured logs     | Winston → Loki         | Discrete events filterable by metadata          |
| RequestContext      | AsyncLocalStorage      | Per-request bag auto-attached to every log/span |

The three channels are linked: every log carries `traceId` (paste into Jaeger to jump) + `correlationId` (Loki's primary filter).

### 9.2 RequestContext store

`src/infrastructure/http/interceptors/request-context.store.ts`:

```typescript
export interface RequestContext {
  correlationId: string;
  traceId?: string;
  userId?: string;
  userEmail?: string;
  source: "http" | "kafka" | "bullmq" | "cron";
}

export const requestContextStore = new AsyncLocalStorage<RequestContext>();
```

Header name: `x-correlation-id` (constant `CORRELATION_ID_HEADER`).

### 9.3 Entry-point wrappers

Each entry point opens a `requestContextStore.run(...)` scope:

| Entry                     | Wrapper                               | Where                           |
| ------------------------- | ------------------------------------- | ------------------------------- |
| HTTP                      | `CorrelationIdInterceptor` (global)   | `correlation-id.interceptor.ts` |
| Kafka                     | `withKafkaRequestContext(...)`        | `with-kafka-request-context.ts` |
| BullMQ (outbox publisher) | `runInRestoredContext(...)` (private) | `outbox-publisher.processor.ts` |

**Generate UUID server-side** if upstream caller didn't supply `x-correlation-id`. No more `correlationId="unknown"` in Loki.

### 9.4 Outbox trace continuity

At save time:

```typescript
private static captureObservability(): CapturedObservability {
  const span = trace.getActiveSpan();
  const ctx = requestContextStore.getStore();
  return {
    traceId: span?.spanContext().traceId ?? null,
    parentSpanId: span?.spanContext().spanId ?? null,
    correlationId: ctx?.correlationId ?? null,
    userId: ctx?.userId ?? null,
  };
}
```

At publish time (in `OutboxPublisherProcessor`):

```typescript
await withRestoredTrace(
  {
    tracerName: 'user-service.outbox',
    operationName: `outbox.publish ${outbox.eventType}`,
    traceId: outbox.traceId,
    parentSpanId: outbox.parentSpanId,
    attributes: { 'event.id': outbox.eventId, ... },
  },
  () => requestContextStore.run(ctx, fn),
);
```

`withRestoredTrace` lives in `@repo/shared` (used by every service). Re-attaches saved span context as parent, opens a child span around the work.

### 9.5 PII redaction

`src/infrastructure/logger/redaction.ts`. Three modes:

| Mode    | Behaviour                                              |
| ------- | ------------------------------------------------------ |
| `off`   | Pass-through (default in dev)                          |
| `hash`  | `email` → `sha256:<16-hex>@<domain>` (default in prod) |
| `strip` | `email` → key removed entirely                         |

Controlled by `LOG_PII_REDACTION_MODE` env var. Hash is **deterministic** so a single user's activity stays stitchable in Loki; domain is preserved for company-level filtering.

### 9.6 Required env vars

```bash
LOKI_HOST=http://localhost:3100      # optional; falls back to file logs
LOG_LEVEL=debug                       # info/warn/error
LOG_PII_REDACTION_MODE=hash           # off | hash | strip; default per NODE_ENV
NODE_ENV=production                   # gates redaction default
```

### 9.7 Tracer naming convention

`<service-name>.<subsystem>`:

- `user-service.kafka` (consumers)
- `user-service.outbox` (publisher)
- `user-service.http` (auto, via OTel HTTP instrumentation)

### 9.8 Outbox observability columns

| Column           | Type        | Index | Purpose                                                   |
| ---------------- | ----------- | ----- | --------------------------------------------------------- |
| `trace_id`       | varchar(32) | yes   | W3C trace ID — Jaeger jump from outbox row                |
| `parent_span_id` | varchar(16) | no    | Span ID of saving span — becomes parent of publish span   |
| `correlation_id` | varchar     | yes   | Loki filter                                               |
| `user_id`        | varchar     | yes   | Per-user audit (`SELECT * FROM outbox WHERE user_id=...`) |

Migration: see `1745625600000-AddOutboxObservability.ts`.

---

## 10. Test Structure & Conventions

### 10.1 Where specs live

```
src/<some-folder>/
  __tests__/
    <module>.spec.ts
```

Co-located with the module they test. Never in a top-level `tests/` folder.

### 10.2 Test stack layers

| Layer              | Path                                     | Coverage target | Mocks                                    |
| ------------------ | ---------------------------------------- | --------------- | ---------------------------------------- |
| Unit (domain)      | `src/domain/**/__tests__/*.spec.ts`      | 90%             | None                                     |
| Unit (application) | `src/application/**/__tests__/*.spec.ts` | 80%             | Repos, outbox, eventBus                  |
| Integration        | `test/integration/*.integration-spec.ts` | 60%             | Real DB (testcontainers / configured PG) |
| E2E                | `test/e2e/*.e2e-spec.ts`                 | golden paths    | Real DB, mocked Kafka/storage            |

### 10.3 --runInBand for integration & e2e

The test DB has documented race conditions when tests run in parallel. **Always pass `--runInBand`**:

```bash
npm run test:integration -- --runInBand
npm run test:e2e -- --runInBand
```

This is encoded in CI scripts. Don't override.

### 10.4 Handler tests are thin

After the Application Service extraction (5.3.E), handler specs only verify the proxy:

```typescript
describe('UpdateUserHandler (thin CQRS adapter)', () => {
  it('forwards command fields to UserUpdateService.update', async () => { ... });
  it('propagates errors thrown by the service', async () => { ... });
});
```

Service spec carries all the use-case test cases.

### 10.5 Service specs use NestJS Test module

```typescript
const module = await Test.createTestingModule({
  providers: [
    UserUpdateService,
    { provide: "IUserRepository", useValue: mockUserRepository },
    { provide: "IOutboxService", useValue: mockOutboxService },
    { provide: "IUnitOfWork", useValue: mockUnitOfWork },
    { provide: EventBus, useValue: mockEventBus },
    { provide: LoggerService, useValue: mockLogger },
  ],
}).compile();

service = module.get<UserUpdateService>(UserUpdateService);
```

Mock at the provider level, not via `jest.mock()`. Easier to read, easier to swap.

### 10.6 Domain tests use no mocks

```typescript
const user = User.create({ email: "a@b.com", firstName: "A", lastName: "B" });
user.suspend("reason", "admin");
expect(user.isSuspended).toBe(true);
expect(user.getUncommittedEvents()).toContainEqual(
  expect.any(UserSuspendedEvent),
);
```

Pure construction + method calls + assertions. No `jest.fn()` in domain specs.

### 10.7 Test execution policy (per memory)

When running test suites during refactoring, use a **background Agent** (per `feedback_test_execution.md` memory). Main thread continues working; agent reports back when done.

---

## 11. NestJS Module Patterns

### 11.1 Module organization

`AppModule` imports feature modules. Each feature module imports `DatabaseModule`, declares its providers (handlers + services + filters + interceptors), exports only what other modules need.

### 11.2 Repository registration

```typescript
{ provide: 'IUserRepository', useClass: TypeOrmUserRepository }
```

String tokens for domain interfaces (collision-resistant via convention `I<Name>`). Inject via `@Inject('IUserRepository')`.

### 11.3 Global concerns

- `APP_INTERCEPTOR`: `CorrelationIdInterceptor` (always-on)
- `APP_FILTER`: `DomainExceptionFilter`, `OptimisticLockFilter`
- `APP_PIPE`: `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true, transform: true`

Set in `AppModule.providers`, not per-controller.

### 11.4 Provider count limit

`max-classes-per-file: 1` is locked. If a module declares 15+ providers, split into sub-modules (e.g., `UserModule` + `CompanyModule` + `CandidateModule`).

---

## 12. Migration Conventions

### 12.1 Naming

`<unix-timestamp-ms>-<PascalCaseName>.ts`. Example: `1745625600000-AddOutboxObservability.ts`.

### 12.2 Class name matches file name

```typescript
export class AddOutboxObservability1745625600000 implements MigrationInterface {
  name = "AddOutboxObservability1745625600000";
  // ...
}
```

The trailing timestamp on the class name is what TypeORM stores in the `migrations` table. Renaming files breaks history.

### 12.3 Reversibility

Both `up()` and `down()` MUST be implemented. CI tests `down()` for new migrations. Always.

### 12.4 Additive changes

For schema changes that need backfill or zero-downtime:

1. Migration A: add nullable column.
2. Backfill via separate script or migration.
3. Migration B (later): add NOT NULL constraint.

Never combine column-add + NOT-NULL + backfill in one migration.

### 12.5 Indexes for filterable columns

If you add a column and queries will filter / sort by it, add a B-tree index in the same migration. Example: outbox observability migration adds three indexes (`trace_id`, `correlation_id`, `user_id`).

### 12.6 Apply to all environments

- **Test DB**: auto via `npm run test:integration` (runs migrations before tests).
- **Dev DB**: manual: `npm run migration:run`.
- **CI**: runs in pipeline.
- **Prod**: `npm run migration:run` in deploy script (gated, reviewed).

After committing a migration, **don't forget dev** — running the service against unmigrated dev DB will fail at first INSERT. Confirm by `mcp__postgres-<service>__query` against `migrations` table.

---

## 13. ESLint Ratchet (locked rules)

As of commit `7a14889` (2026-04-25), all 6 complexity rules are locked at `error` for user-service. **Any future regression fails CI**.

### 13.1 Locked rules

| Rule                           | Limit | Locked in  | Rationale                                             |
| ------------------------------ | ----- | ---------- | ----------------------------------------------------- |
| `max-classes-per-file`         | 1     | 5.3.A      | God-file prevention                                   |
| `max-params`                   | 4     | 5.2        | Forces Parameter Object when growing                  |
| `max-lines-per-function`       | 30    | 5.3.C      | Compose Method threshold                              |
| `complexity` (cyclomatic)      | 10    | 5.3.C      | Forces Replace Conditional with Polymorphism          |
| `sonarjs/cognitive-complexity` | 10    | 5.3.C      | Cognitive load cap                                    |
| `max-depth`                    | 2     | 5.3.C-tail | One level of abstraction per function (Clean Code §3) |

### 13.2 Per-service overrides

Three layered overrides in `apps/user-service/eslint.config.mjs`:

1. **Ratchet block** — `files: ['src/**/*.ts']`, all 6 rules at error.
2. **Controller exemption** — `files: ['src/infrastructure/http/controllers/**/*.ts']`, `max-lines-per-function: warn @ 100`. Reason: Swagger decorators (@ApiResponse etc.) inflate the count without adding procedural code.
3. **Test/migration exemption** — `files: ['**/*.spec.ts', '**/*.test.ts', '**/__tests__/**/*.ts', '**/test/**/*.ts', '**/migrations/*.ts']`, all 6 rules off.

Order matters: ratchet → controller exemption → test/migration exemption.

### 13.3 When to use eslint-disable

Only for documented architectural exceptions:

- **Application Service constructor** with 5 deps (use case scope, not SRP smell): `// eslint-disable-next-line max-params` + comment.
- **CQRS Read-side service** composing multiple repos: same.
- **Module bundle providers > 15** that resist further splitting: `// eslint-disable-next-line max-classes-per-file` (rare).

Every `eslint-disable` line must have an inline comment explaining why. No silent disables.

### 13.4 One-way movement

A rule can go `warn → error`, never `error → warn`. The ratchet only tightens. New rules graduate to error after the codebase reaches 0 violations.

---

## 14. Adoption Checklist for New Services

When starting Phase 5 cleanup on a new service (notification-service, api-gateway, etc.), verify each item below. Anything missing = add it.

### 14.1 Layer separation

- [ ] `src/domain/` has zero NestJS / TypeORM imports
- [ ] Repository interfaces in `domain/repositories/`, implementations in `infrastructure/persistence/repositories/`
- [ ] Domain events extend a base `DomainEvent` class
- [ ] Aggregates use private constructor + `create()` / `reconstitute()`

### 14.2 Aggregates & VOs

- [ ] Per-field update helpers (not generic), each ≤ 30 lines, ≤ 1 param
- [ ] Three-state VO update for nullable VO fields
- [ ] Guard clauses at top of mutating methods
- [ ] Collections returned as defensive copies

### 14.3 Domain exceptions

- [ ] Each exception class declares `static readonly code` + `static readonly httpStatus`
- [ ] `DomainExceptionFilter` reads via `exception.constructor` walking prototype chain (no instanceof chain)
- [ ] PG SQLSTATE 23505 translation lives in Application Services, not in repos

### 14.4 Application Services

- [ ] One service per use case, not per aggregate
- [ ] Naming: `<Aggregate><Action>Service.<verb>()` — `UserUpdateService.update()`
- [ ] Each service exports `XxxInput` interface
- [ ] Handlers are thin proxies (single statement)
- [ ] Service uses `IUnitOfWork.execute()` for atomic save + outbox

### 14.5 Repositories

- [ ] Read/write split (`IUserRepository` vs `IUserReadRepository`)
- [ ] `applyXxxFilters` helper if 3+ filter conditions
- [ ] `Bindings` Parameter Object if 4+ SQL param indices

### 14.6 Outbox

- [ ] `outbox` table has `trace_id`, `parent_span_id`, `correlation_id`, `user_id` columns
- [ ] `OutboxService.buildOutboxEntity()` calls `captureObservability()` at save time
- [ ] `OutboxPublisherProcessor` wraps `process()` in `withRestoredTrace` + `requestContextStore.run`
- [ ] Save-order tested: outbox BEFORE delete; aggregate BEFORE outbox for create/update

### 14.7 Observability

- [ ] `request-context.store.ts` with `RequestContext` interface (correlationId, traceId, userId, userEmail, source)
- [ ] HTTP interceptor generates UUID server-side if header missing, reads userId/email from JWT, traceId from active span
- [ ] Kafka consumers wrapped in `withKafkaRequestContext`
- [ ] `redaction.ts` with hash/strip/off modes; default hash-in-prod, off-in-dev
- [ ] Logger calls `redactPIIFields(merged, this.redactionMode)` in `enrichWithRequestContext`
- [ ] `LOG_PII_REDACTION_MODE` env var documented

### 14.8 Tests

- [ ] Tests co-located in `__tests__/` folders
- [ ] Service specs use `Test.createTestingModule` with provider mocks
- [ ] Handler specs are thin (forward + propagate)
- [ ] Domain specs use no mocks
- [ ] Integration + e2e run with `--runInBand`

### 14.9 ESLint

- [ ] All 6 ratchet rules locked at error in `eslint.config.mjs`
- [ ] Controller exemption present (`max-lines-per-function: warn @ 100`)
- [ ] Test/migration exemption present (all 6 rules off)
- [ ] 0 errors / 0 warnings on `src` and `test`

### 14.10 Migration discipline

- [ ] Migration timestamps unique (no collision with existing)
- [ ] Both `up()` and `down()` implemented
- [ ] Indexes added for filterable columns
- [ ] Migration applied to dev DB after merge (`npm run migration:run`)

### 14.11 Service-specific

- [ ] Controllers under 100 lines per method (Swagger-inflated)
- [ ] Module bundles split when > 15 providers
- [ ] OTel tracer name pattern `<service-name>.<subsystem>`
- [ ] Service-specific CLAUDE.md updated

---

## Maintaining this document

This is a living document. When a new pattern is established (e.g., new ratchet rule locked, new architectural decision), update the relevant section here **before** moving on to the next service. Future-you and anyone joining the project will start from this doc, not from PR archaeology.

Last updated: 2026-04-25 (commit `ff74cb9`).
