Generate and run a TypeORM migration for $ARGUMENTS.

## Steps

1. **Determine the correct service** from the migration context:
   - User/role/company/skill changes → `apps/user-service`
   - Template/question/invitation/response changes → `apps/interview-service`
   - Analysis result changes → `apps/ai-analysis-service`

2. **Check current migration state**:
   ```bash
   cd apps/<service> && npm run migration:show
   ```

3. **Generate migration** (from service directory):
   ```bash
   npm run migration:generate -- src/infrastructure/persistence/migrations/<MigrationName>
   ```
   Use PascalCase descriptive names: `AddEmailVerificationToUser`, `CreateInvitationsTable`, `AddScoreColumnsToAnalysis`

4. **Review the generated migration**:
   - Open the generated file in `src/infrastructure/persistence/migrations/`
   - Verify the SQL in `up()` method is correct
   - Verify the `down()` method properly reverses all changes
   - Check for: correct table names, column types, nullable flags, defaults, indexes, foreign keys

5. **Run the migration**:
   ```bash
   npm run migration:run
   ```

6. **Verify success**:
   ```bash
   npm run migration:show
   ```
   The new migration should show as `[X]` (applied).

## Rules
- Every migration MUST be reversible — `down()` must undo everything `up()` does
- Never modify an already-applied migration. Create a new one instead.
- Use descriptive names that explain WHAT changed, not WHEN
- Test migrations against the test database before applying to dev
