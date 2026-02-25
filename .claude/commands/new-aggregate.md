Create a new DDD Aggregate Root for $ARGUMENTS.

## 10-Step Checklist

### Step 1: Create Aggregate Root
`src/domain/aggregates/<name>.aggregate.ts`
- Extend `AggregateRoot` base class from `src/domain/base/`
- **Private constructor** — enforce creation through factory methods only
- `static create(props)` factory — creates new instance, applies creation domain event
- `static reconstitute(props)` factory — recreates from persistence, NO events emitted
- Business methods that enforce invariants and apply domain events
- Only getters, **no setters** — mutations only through business methods
- Guard methods: `ensureNotDeleted()`, `ensureActive()`, etc.

### Step 2: Create Value Objects
`src/domain/value-objects/<name>.vo.ts`
- Extend `ValueObject` base class
- `static create(value)` factory with validation
- `equals(other)` method for comparison
- Immutable — all properties readonly
- One VO per domain concept (Email, Status, Score, etc.)

### Step 3: Create Domain Events
`src/domain/events/<aggregate>-<action>.event.ts`
- One file per event (e.g., `user-created.event.ts`)
- Include all relevant data for event consumers
- Events are immutable records of what happened

### Step 4: Create Domain Exceptions
`src/domain/exceptions/<aggregate>.exceptions.ts`
- Extend base `DomainException`
- Descriptive names: `UserAlreadyExistsException`, `TemplateArchivedException`
- Include relevant context data

### Step 5: Create Repository Interface
`src/domain/repositories/<name>.repository.interface.ts`
- Interface only (e.g., `IUserRepository`)
- Define: `save()`, `findById()`, `findByX()`, `delete()`, `exists()`
- Optionally create `I<Name>ReadRepository` for query-side

### Step 6: Create TypeORM Entity
`src/infrastructure/persistence/entities/<name>.entity.ts`
- TypeORM `@Entity()` decorated class
- Maps to database table
- This is an INFRASTRUCTURE concern, NOT a domain object
- Include `@PrimaryColumn`, `@Column`, `@CreateDateColumn`, `@UpdateDateColumn`

### Step 7: Create TypeORM Repository Implementation
`src/infrastructure/persistence/repositories/typeorm-<name>.repository.ts`
- Implements the domain repository interface
- Uses TypeORM `Repository<Entity>` internally
- Converts between TypeORM entities and domain aggregates using mappers

### Step 8: Create Persistence Mapper
`src/infrastructure/persistence/mappers/<name>.mapper.ts`
- `toDomain(entity): Aggregate` — converts TypeORM entity to domain aggregate (uses `reconstitute()`)
- `toPersistence(aggregate): Entity` — converts domain aggregate to TypeORM entity

### Step 9: Create Database Migration
```bash
npm run migration:generate -- src/infrastructure/persistence/migrations/Create<Name>Table
```
- Verify both `up()` and `down()` methods
- Run with `npm run migration:run`

### Step 10: Write Tests
- `src/domain/aggregates/__tests__/<name>.aggregate.spec.ts` — test invariants, factory methods, business rules
- `src/domain/value-objects/__tests__/<name>.vo.spec.ts` — test validation, equality
- `src/application/commands/<command>/__tests__/*.spec.ts` — test handlers with mocked repos

## Aggregate Template

```typescript
export class MyAggregate extends AggregateRoot {
  private constructor(
    private readonly _id: string,
    private _name: NameVO,
    private _status: StatusVO,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {
    super();
  }

  static create(id: string, name: NameVO): MyAggregate {
    const aggregate = new MyAggregate(id, name, StatusVO.create('active'), new Date(), new Date());
    aggregate.apply(new MyAggregateCreatedEvent(id, name.value));
    return aggregate;
  }

  static reconstitute(props: MyAggregateProps): MyAggregate {
    return new MyAggregate(props.id, props.name, props.status, props.createdAt, props.updatedAt);
  }

  // Getters
  get id(): string { return this._id; }
  get name(): NameVO { return this._name; }

  // Business methods
  updateName(newName: NameVO): void {
    this.ensureActive();
    this._name = newName;
    this._updatedAt = new Date();
    this.apply(new MyAggregateUpdatedEvent(this._id, newName.value));
  }

  private ensureActive(): void {
    if (this._status.value !== 'active') {
      throw new MyAggregateNotActiveException(this._id);
    }
  }
}
```
