# User Service

## Overview

Domain-driven microservice responsible for user management, company profiles, candidate skills, and role assignment. Implements DDD + CQRS + Clean Architecture with strict layer separation and the Outbox pattern for reliable event publishing.

- **Port**: 8002
- **Database**: PostgreSQL 15 (`ai_video_interview_user`)
- **Architecture**: DDD + CQRS + Clean Architecture

## Tech Stack

- NestJS 11, TypeScript 5
- @nestjs/cqrs (command/query bus, event bus)
- TypeORM 0.3 (PostgreSQL, migrations)
- kafkajs (event publishing via Outbox)
- BullMQ (Outbox job processing)
- MinIO (S3-compatible avatar storage)
- prom-client (Prometheus metrics)
- Winston (structured logging)
- Jest 30 (testing, 80% coverage global, 90% domain layer)

## Architecture

```
src/
  domain/                    # Pure domain logic (no framework dependencies)
    aggregates/
      user.aggregate.ts      # User aggregate root
      company.aggregate.ts   # Company aggregate root
      candidate-profile.aggregate.ts
    entities/
      skill.entity.ts
      skill-category.entity.ts
      candidate-skill.entity.ts
      user-company.entity.ts
    value-objects/
      email.vo.ts            # Email with regex validation
      full-name.vo.ts        # First + last name
      user-status.vo.ts      # active | suspended | deleted
      user-role.vo.ts        # pending | candidate | hr | admin
      experience-level.vo.ts # junior | middle | senior | lead | principal
      proficiency-level.vo.ts
      company-size.vo.ts
      years-of-experience.vo.ts
    events/                  # Domain events (UserCreated, UserUpdated, etc.)
    exceptions/              # DomainException, UserAlreadyExistsException, etc.
    repositories/            # Interfaces only (IUserRepository, IRoleRepository)
    base/                    # AggregateRoot, Entity, ValueObject base classes
  application/               # Use cases (depends on domain, not infrastructure)
    commands/
      create-user/           # CreateUserCommand + CreateUserHandler
      update-user/
      delete-user/
      suspend-user/
      activate-user/
      select-role/
      upload-avatar/
      hr/create-company/
      candidate/add-candidate-skill/
      admin/create-skill/
    queries/
      get-user/
      list-users/
      get-user-stats/
      get-user-by-external-auth-id/
      get-user-permissions/
      # + company queries, candidate queries, skill queries
    dto/                     # Request/Response DTOs
  infrastructure/            # Framework and external service implementations
    persistence/
      entities/              # TypeORM entities (UserEntity, OutboxEntity, etc.)
      repositories/          # TypeORM implementations (TypeOrmUserRepository)
      mappers/               # Domain <-> Entity mappers (UserMapper)
      migrations/            # TypeORM migrations (timestamped)
      typeorm.config.ts
    kafka/
      producers/             # user-event.producer.ts
      consumers/             # auth-login.consumer.ts
    messaging/
      outbox/                # OutboxService, OutboxPublisherProcessor, OutboxScheduler
    http/
      controllers/           # REST controllers (health.controller.ts)
      guards/                # InternalServiceGuard, RolesGuard
      decorators/            # @Public(), @Roles(), @CurrentUser()
      filters/               # DomainExceptionFilter
    storage/                 # MinioStorageService
    logger/
    metrics/
```

## Domain Model

### Aggregates

**User** (primary aggregate root):
- Private constructor + static `create()` factory method + `reconstitute()` for persistence
- Business methods: `updateProfile()`, `changeEmail()`, `verifyEmail()`, `suspend()`, `activate()`, `delete()`, `uploadAvatar()`, `selectRole()`
- Invariants enforced: `ensureNotDeleted()`, `ensureNotSuspended()`
- Role is immutable after selection (pending -> candidate/hr/admin, one-time only)
- Events emitted via `this.apply(new UserCreatedEvent(...))`

**Company**: Created by HR users, contains company metadata.

**CandidateProfile**: Extended profile for candidates with skills and experience.

### Value Objects

All value objects extend `ValueObject<T>` base class with `equals()` semantics:

```typescript
// Pattern: private constructor + static create() with validation
export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) { super(props); }

  public static create(email: string): Email {
    // Validation: required, regex, max 255 chars
    const normalized = email.toLowerCase().trim();
    return new Email({ value: normalized });
  }

  public get value(): string { return this.props.value; }
}
```

### Repository Pattern

Domain defines interfaces; infrastructure implements them:

```typescript
// Domain layer (interface only)
export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByExternalAuthId(externalAuthId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  delete(id: string): Promise<void>;
}

// Infrastructure layer (TypeORM implementation)
@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly repository: Repository<UserEntity>,
    private readonly mapper: UserMapper,
  ) {}
  // Uses UserMapper to convert between domain aggregate and TypeORM entity
}

// Injection via token
@Inject('IUserRepository') private readonly userRepository: IUserRepository
```

## Key Patterns

### Command Handler Pattern

```typescript
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
    private readonly outboxService: OutboxService,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    // 1. Validate uniqueness (email, externalAuthId)
    // 2. Create value objects (Email.create(), FullName.create())
    // 3. Create aggregate via factory method (User.create())
    // 4. Save to repository
    // 5. Publish internal domain events via EventBus
    // 6. Save integration event to Outbox for Kafka publishing
    return user;
  }
}
```

### Outbox Pattern Flow

```
Command Handler
  -> outboxService.saveEvent('user.created', payload, aggregateId)
    -> Save to outbox table (status: 'pending')
    -> Add BullMQ job (jobId = eventId, attempts: 3, exponential backoff: 2s)
      -> OutboxPublisherProcessor picks up job
        -> Read from outbox table
        -> Publish to Kafka topic
        -> Update outbox status to 'published'
      -> On failure: BullMQ retries (max 3, exponential backoff)
  -> OutboxScheduler periodically scans for stuck 'pending' events
```

### Domain Event Flow

```
Aggregate.apply(event)  ->  Handler calls eventBus.publish(event)  ->  Internal handlers
                        ->  Handler calls outboxService.saveEvent()  ->  Kafka (external)
```

## Commands

```bash
cd apps/user-service
npm run start:dev          # Development with hot reload
npm run build              # Production build
npm run test               # Unit tests
npm run test:cov           # Coverage report
npm run migration:generate # Generate new migration
npm run migration:run      # Run pending migrations
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 8002) |
| DATABASE_HOST | PostgreSQL host |
| DATABASE_PORT | PostgreSQL port (default: 5432) |
| DATABASE_NAME | Database name (ai_video_interview_user) |
| DATABASE_USER | Database username |
| DATABASE_PASSWORD | Database password |
| KAFKA_BROKERS | Kafka broker addresses |
| REDIS_HOST | Redis host for BullMQ |
| MINIO_ENDPOINT | MinIO endpoint |
| MINIO_ACCESS_KEY | MinIO access key |
| MINIO_SECRET_KEY | MinIO secret key |
| MINIO_BUCKET | MinIO bucket name |

## Testing

- **Domain layer** (90% coverage): Pure unit tests, no mocks needed. Test aggregate invariants, value object validation, event emission.
- **Application layer** (80% coverage): Mock repositories and outbox service. Test command handler orchestration logic.
- **Infrastructure layer**: Integration tests with real PostgreSQL (testcontainers) for repository and migration testing.

---

## Skills & Best Practices

### DDD Tactical Patterns

- **Aggregate design rules**: Keep aggregates small. The User aggregate owns only its direct state (email, name, status, role). Related entities like CandidateSkill are managed through their own aggregate (CandidateProfile), not nested inside User. Reference other aggregates by ID only, never by direct object reference.
- **Invariant enforcement**: All business rules are enforced inside the aggregate, never in handlers or controllers. Call `ensureNotDeleted()` and `ensureNotSuspended()` at the start of every mutating method. Throw domain-specific exceptions (`UserDeletedException`, `InvalidUserOperationException`), not generic errors.
- **Factory methods over constructors**: Make constructors private. Use `static create()` for new instances (emits domain events) and `static reconstitute()` for rebuilding from persistence (no events). This ensures events are only emitted on genuine state changes.
- **Eventual consistency**: Use domain events for cross-aggregate side effects. When a user selects a role, emit `UserUpdatedEvent` which other aggregates (CandidateProfile, Company) can react to asynchronously. Never modify two aggregates in the same transaction.
- **Immutability**: Value objects are immutable after creation. Return defensive copies of collections (`return [...this.props.questions]`). Use private setters on aggregate state -- expose only getters.

### CQRS Best Practices

- **Command vs query separation**: Commands return the affected aggregate or void; queries return DTOs. Never perform writes in query handlers. Commands go through `CommandBus.execute()`, queries through `QueryBus.execute()`.
- **Event handler idempotency**: Event handlers that trigger side effects (outbox, notifications) must be idempotent. Use unique event IDs and check for duplicate processing before executing side effects. The Outbox pattern helps by using `jobId: eventId` to prevent duplicate BullMQ jobs.
- **Command validation**: Validate at two levels: (1) DTO validation with class-validator in the controller, (2) domain validation inside the aggregate. Never trust that the DTO is sufficient -- the aggregate is the final authority on business rules.
- **Handler dependencies**: Command handlers depend on repository interfaces and OutboxService. They should NOT directly depend on other command handlers. Use domain events for cross-command orchestration.

### TypeORM Best Practices

- **Migration strategies**: Always use explicit migrations, never `synchronize: true` in production. Name migrations with timestamps: `1730460000000-InitialSchema.ts`. Each migration should be reversible (implement both `up()` and `down()`).
- **Query builder vs repository**: Use the TypeORM Repository API for simple CRUD. Switch to QueryBuilder for complex joins, subqueries, or when you need precise control over the generated SQL. Avoid mixing both patterns in the same repository method.
- **Connection pooling**: Configure pool size based on expected concurrency: `max: 20` for production, `max: 5` for development. Set `connectionTimeoutMillis: 5000` and enable `extra: { statement_timeout: '30s' }` to prevent long-running queries.
- **N+1 prevention**: When loading aggregates with relations, use `relations: ['roles']` in `findOne()` or use QueryBuilder's `leftJoinAndSelect()`. Never load relations in a loop. For list queries, prefer read models (flat DTOs) over full aggregate reconstitution.
- **Transactions**: Wrap multi-step operations in transactions using `DataSource.transaction()` or `QueryRunner`. The outbox save and aggregate save should ideally be in the same transaction to guarantee atomicity.
- **Entity mapping**: Keep TypeORM entities (`UserEntity`) separate from domain aggregates (`User`). Use explicit `UserMapper.toEntity()` and `UserMapper.toDomain()` methods. Never let TypeORM decorators leak into the domain layer.

### PostgreSQL Best Practices

- **Indexing strategies**: Create indexes on all foreign keys and columns used in WHERE clauses. Use partial indexes for soft-delete patterns: `CREATE INDEX idx_users_active ON users (email) WHERE status = 'active'`. Use GIN indexes for JSONB columns if you query inside them.
- **UUID generation**: Generate UUIDs in the application layer (`uuid v4`), not in PostgreSQL. This allows the command handler to know the ID before persisting, which is needed for the outbox pattern (aggregateId).
- **Constraint naming**: Use consistent constraint naming: `pk_<table>`, `fk_<table>_<column>`, `uq_<table>_<column>`, `idx_<table>_<column>`. This makes migration management and error handling predictable.
- **JSON columns**: Use `jsonb` type for semi-structured data (outbox payload, metadata). Avoid deep nesting. For frequently queried fields, extract them into proper columns with indexes.

### Value Object Patterns

- **Validation in factory method**: All validation happens in the static `create()` method. If validation fails, throw a `DomainException` with a descriptive message. Never allow construction of an invalid value object.
- **Immutability**: Value objects are immutable. To "change" a value, create a new instance. The `Email` class normalizes to lowercase in `create()` and never exposes a setter.
- **Equality semantics**: The base `ValueObject` class provides `equals()` based on deep comparison of `props`. Two `Email` objects with the same value are equal regardless of instance identity.
- **Serialization**: Provide a `toString()` method for logging and a `value` getter for persistence. When persisting, map the value object to a primitive column (e.g., `email.value` -> `VARCHAR`). When reconstituting, call `Email.create(rawValue)` to re-validate.
- **Enum-based value objects**: For status/role types, use an enum backing + named factory methods: `UserStatus.active()`, `UserStatus.suspended()`. Provide type guard methods: `isActive()`, `isSuspended()`. Include transition validators: `canBeModified()`, `canBePublished()`.

### Outbox Pattern Best Practices

- **Idempotent consumers**: Use `jobId: eventId` in BullMQ to prevent duplicate job creation. On the Kafka consumer side, track processed event IDs in a `processed_events` table and skip duplicates.
- **Ordering guarantees**: Within a single aggregate, events are ordered by creation time in the outbox table. BullMQ processes jobs sequentially per queue by default. For strict cross-aggregate ordering, partition Kafka messages by aggregate ID.
- **Retry strategies**: Use exponential backoff (2s base, 3 attempts) for transient failures. After max retries, move to a dead letter queue. The `OutboxScheduler` periodically scans for stuck `pending` events older than 5 minutes and re-queues them.
- **Dead letter handling**: Events that fail all retry attempts stay in the outbox table with status `failed`. Implement an admin endpoint or dashboard to inspect and manually retry failed events.
- **Atomicity**: Ideally, the aggregate save and outbox save happen in the same database transaction. If this is not possible (different databases), accept at-least-once delivery and ensure consumers are idempotent.

### Kafka Producer Best Practices

- **Partitioning**: Use the aggregate ID (userId, companyId) as the Kafka partition key. This ensures all events for the same aggregate land in the same partition, preserving order per aggregate.
- **Key selection**: Set `key: aggregateId` on every Kafka message. This enables log compaction and ordered consumption per entity.
- **Serialization**: Use JSON serialization with a versioned envelope: `{ eventId, eventType, timestamp, version, source, payload }`. Always include a `version` field to support schema evolution.
- **Error handling**: Catch and log Kafka producer errors but do not throw them to the caller. The outbox pattern ensures the event is persisted; Kafka delivery will be retried. Increment `kafka_messages_produced_total{status=failure}` on errors.

### MinIO / S3 Best Practices

- **Presigned URLs**: Generate presigned upload URLs with short TTLs (15 minutes). Return the presigned URL to the client for direct upload, avoiding large file transfers through the API.
- **Bucket policies**: Use separate buckets per environment (dev, staging, prod). Set lifecycle rules to delete temporary uploads after 24 hours.
- **Content type handling**: Validate content type on upload (allow only `image/jpeg`, `image/png`, `image/webp` for avatars). Set the correct `Content-Type` header when uploading to MinIO.

### Testing DDD Services

- **Domain unit tests (no mocks)**: Test aggregates and value objects directly. Create instances via factory methods, call business methods, assert state changes and emitted events. Example: `const user = User.create(...); user.suspend('reason', 'admin'); expect(user.isSuspended).toBe(true);`
- **Value object tests**: Test all validation paths: valid input, empty input, boundary values, malformed input. Test equality: `expect(Email.create('a@b.com').equals(Email.create('A@B.com'))).toBe(true)`.
- **Application tests (mocked repos)**: Mock `IUserRepository`, `OutboxService`, and `EventBus`. Verify the handler calls `repository.save()`, `outboxService.saveEvent()`, and `eventBus.publish()` with correct arguments.
- **Integration tests (real DB)**: Use a test PostgreSQL instance. Run migrations, execute the full command handler flow, verify the database state. Clean up between tests with transaction rollback or table truncation.
- **Test naming convention**: Use descriptive names: `it('should throw UserAlreadyExistsException when email is taken')`. Group by method: `describe('User.suspend()')`.

### Redis & BullMQ Patterns (User Service Specific)

- **Outbox job design**: The outbox BullMQ queue processes one job per domain event. Each job carries the outbox entity ID, not the full event payload (payload is read from the outbox table). Use `jobId: eventId` to prevent duplicate job creation even if `saveEvent()` is called twice.
- **Job TTL and cleanup**: Set `removeOnComplete: { age: 3600 }` (keep completed jobs 1 hour for debugging) and `removeOnFail: { count: 100 }` (keep last 100 failed jobs). This prevents Redis memory from growing unboundedly.
- **Worker concurrency**: For outbox publishing, set concurrency to 3-5. Higher concurrency risks Kafka producer overload. Lower concurrency causes event delivery lag. Monitor `waiting` job count as a leading indicator of publishing delays.
- **Graceful shutdown**: BullMQ workers must be closed before the NestJS process exits. Register `onModuleDestroy` in the outbox module to call `worker.close()`. This ensures in-progress jobs complete before shutdown and are not stuck in `active` state.
- **Scheduled cleanup**: The OutboxScheduler runs every 60 seconds to find stuck `pending` outbox entries (older than 5 minutes). It re-queues them as BullMQ jobs. This handles edge cases where a job was lost due to Redis restart.

### NestJS Module Patterns (User Service Specific)

- **Module hierarchy**: `AppModule` imports `DatabaseModule`, `KafkaModule`, `OutboxModule`, `HttpModule`. `DatabaseModule` registers TypeORM entities and repositories. `KafkaModule` registers consumers and producers. Keep module responsibilities focused — no module should import everything.
- **Repository registration**: Register domain repository interfaces with TypeORM implementations using custom providers: `{ provide: 'IUserRepository', useClass: TypeOrmUserRepository }`. Always inject via the interface token, never the implementation class. This enables testing with in-memory repositories.
- **Guard composition**: `InternalServiceGuard` checks `x-internal-request` header for service-to-service calls. `RolesGuard` checks JWT roles for external calls. Stack guards logically: internal calls skip role checks, external calls require authentication + authorization.
- **Read model separation**: For list queries, create separate read repositories (`UserReadRepository`) that return flat DTOs directly via SQL/QueryBuilder. These bypass aggregate reconstitution (avoiding mapper overhead) and can use optimized indexes. Write repositories return domain aggregates.

### Domain Event Design (User Service Specific)

- **Event granularity**: Emit specific events (`UserSuspendedEvent`, `UserActivatedEvent`) rather than generic ones (`UserUpdatedEvent` with a changed field). Specific events are easier for consumers to handle and enable precise reactions (e.g., only react to suspension, not every update).
- **Event payload**: Include the full current state of the relevant fields, not just the delta. Consumers should be able to reconstruct the entity's current state from the event without querying the source service. Include `previousStatus` for state transitions to support audit trails.
- **Cross-aggregate events**: When a command affects multiple aggregates (e.g., role selection creates CandidateProfile), use the EventBus for internal side effects. The primary aggregate emits the event, and an EventHandler in the same service reacts to create/update the secondary aggregate.
