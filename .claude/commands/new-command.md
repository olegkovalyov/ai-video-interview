Create a new CQRS Command for $ARGUMENTS in the appropriate service.

## Checklist

1. **Determine the correct service** based on the domain context
2. **Create command class** in `src/application/commands/<command-name>/<command-name>.command.ts`:
   - Export a class extending `ICommand`
   - Constructor receives all necessary data via readonly properties
3. **Create handler** in `src/application/commands/<command-name>/<command-name>.handler.ts`:
   - Decorate with `@CommandHandler(CommandClass)`
   - Implement `ICommandHandler<CommandClass>`
   - Inject repository interfaces using `@Inject('IRepository')` token pattern
   - Inject `EventBus` for domain events
   - Inject `OutboxService` for integration events (if cross-service communication needed)
   - Inject `LoggerService` for structured logging
   - Follow the execution flow:
     1. Validate preconditions (check existing entities, business rules)
     2. Create Value Objects from command data
     3. Create or load Aggregate via factory method
     4. Execute business logic on aggregate
     5. Save aggregate via repository
     6. Publish domain events via `eventBus.publishAll(aggregate.getUncommittedEvents())`
     7. Publish integration events via `outboxService.saveEvent()` if needed
4. **Register handler** in the service's `ApplicationModule` providers array
5. **Create DTO** if a new HTTP endpoint is needed: `src/application/dto/requests/<name>.dto.ts`
6. **Create controller endpoint** in `src/infrastructure/http/controllers/` if HTTP access needed
7. **Create unit test** in `src/application/commands/<command-name>/__tests__/<command-name>.handler.spec.ts`

## Handler Template

```typescript
@CommandHandler(CommandClass)
export class CommandNameHandler implements ICommandHandler<CommandClass> {
  constructor(
    @Inject('IRepository') private readonly repository: IRepository,
    private readonly eventBus: EventBus,
    private readonly outboxService: OutboxService,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: CommandClass): Promise<Result> {
    this.logger.log(`Executing ${CommandClass.name}`, { ...command });

    // 1. Validate
    // 2. Create Value Objects
    // 3. Create/Load Aggregate
    // 4. Business logic
    // 5. Save
    // 6. Publish events

    return result;
  }
}
```
