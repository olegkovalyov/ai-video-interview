Run tests for $ARGUMENTS service.

## Steps

1. **Navigate to the service directory**: `apps/$ARGUMENTS`

2. **Run unit tests**:
   ```bash
   cd apps/$ARGUMENTS && npm run test
   ```

3. **Run integration tests** (if available):
   ```bash
   cd apps/$ARGUMENTS && npm run test:integration
   ```

4. **Report results**:
   - Total tests passed/failed/skipped
   - Coverage summary (statements, branches, functions, lines)
   - Any coverage threshold violations (80% global, 90% domain)

5. **If tests fail**:
   - Analyze the failure output
   - Identify root cause (missing mock, changed API, broken import, etc.)
   - Suggest specific fixes with file paths and line numbers

## Coverage Thresholds
- Global: 80% (statements, branches, functions, lines)
- Domain layer (`src/domain/**`): 90%

## Valid service names
- `user-service`
- `interview-service`
- `ai-analysis-service`
- `api-gateway`
- `web`
