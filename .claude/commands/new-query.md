Create a new CQRS Query for $ARGUMENTS in the appropriate service.

## Checklist

1. **Determine the correct service** based on the domain context
2. **Create query class** in `src/application/queries/<query-name>/<query-name>.query.ts`:
   - Export a class with readonly properties for query parameters
   - Include pagination params if listing (page, limit, sortBy, sortOrder)
3. **Create handler** in `src/application/queries/<query-name>/<query-name>.handler.ts`:
   - Decorate with `@QueryHandler(QueryClass)`
   - Implement `IQueryHandler<QueryClass>`
   - Inject the **READ** repository interface using `@Inject('IReadRepository')` token
   - Return DTOs or read-models, **never** domain aggregates
   - Use read-models from `src/domain/read-models/` for complex projections
4. **Create response DTO** in `src/application/dto/responses/` if not already existing
5. **Register handler** in the service's `ApplicationModule` providers array
6. **Create controller endpoint** in `src/infrastructure/http/controllers/`
7. **Create unit test** for the handler

## Handler Template

```typescript
@QueryHandler(QueryClass)
export class QueryNameHandler implements IQueryHandler<QueryClass> {
  constructor(
    @Inject('IReadRepository') private readonly readRepository: IReadRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(query: QueryClass): Promise<ResponseDto> {
    this.logger.log(`Executing ${QueryClass.name}`, { ...query });

    const result = await this.readRepository.findBy(query.params);

    if (!result) {
      throw new NotFoundException(`Entity not found`);
    }

    return ResponseDto.from(result);
  }
}
```

## Rules
- Queries are read-only. Never mutate state in a query handler.
- Use read-optimized repository methods (avoid loading full aggregates for queries).
- For list queries, always support pagination via `{ page, limit, total, items }` response shape.
