# AI Analysis Service

## Overview

Domain-driven microservice responsible for AI-powered analysis of completed interviews. Consumes `invitation.completed` events from Kafka, runs per-question analysis and overall summary generation via Groq LLM, persists results, and publishes `analysis.completed` events. Implements DDD with Ports & Adapters pattern for LLM integration.

- **Port**: 8005
- **Database**: PostgreSQL 15 (`ai_video_interview_analysis`)
- **Architecture**: DDD + CQRS + Ports & Adapters (Hexagonal)

## Tech Stack

- NestJS 11, TypeScript 5
- @nestjs/cqrs (command/query bus)
- TypeORM 0.3 (PostgreSQL, migrations)
- groq-sdk / native fetch (Groq Cloud API for LLM inference)
- kafkajs (event consumption and publishing)
- BullMQ (job processing)
- prom-client (Prometheus metrics)
- Winston (structured logging)
- Jest 30 (testing)

## Architecture

```
src/
  domain/
    aggregates/
      analysis-result.aggregate.ts      # Main aggregate (pending->in_progress->completed->failed)
    entities/
      question-analysis.entity.ts       # Per-question analysis result
    value-objects/
      score.vo.ts                       # 0-100 score with validation
      analysis-status.vo.ts             # pending | in_progress | completed | failed
      question-type.vo.ts               # open | multiple_choice | technical | behavioral
      criteria-score.vo.ts              # { criterion, score, weight }
      recommendation.vo.ts              # hire | consider | reject
      analysis-metadata.vo.ts           # Model info, tokens, processing time
    events/
      analysis-started.event.ts
      analysis-completed.event.ts
      analysis-failed.event.ts
    exceptions/
      analysis.exceptions.ts            # AnalysisAlreadyExistsException, etc.
    repositories/
      analysis-result.repository.interface.ts
  shared/
    base/                               # AggregateRoot, Entity, ValueObject base classes
    exceptions/                         # DomainException
  application/
    ports/                              # CRITICAL: Application-level port interfaces
      analysis-engine.port.ts           # IAnalysisEngine (analyzeResponse, generateSummary)
      event-publisher.port.ts           # IEventPublisher (publish domain events to Kafka)
      prompt-loader.port.ts             # IPromptLoader (load prompt templates and criteria)
    commands/
      analyze-interview/                # Main analysis workflow
      retry-analysis/                   # Retry failed analysis
    queries/
      get-analysis-result/
      get-analysis-by-invitation/
      list-analyses/
    mappers/
      analysis-result.mapper.ts         # Domain -> Response DTO
    dto/
  infrastructure/
    llm/
      groq-analysis-engine.ts           # IAnalysisEngine implementation (Groq Cloud API)
      llm.module.ts                     # Binds port tokens to implementations
    kafka/
      consumers/
        invitation-completed.consumer.ts # Consumes invitation.completed events
      kafka.module.ts
    persistence/
      entities/
        analysis-result.entity.ts
        question-analysis.entity.ts
        processed-event.entity.ts       # Idempotency tracking
      repositories/
        typeorm-analysis-result.repository.ts
      mappers/
        analysis-result.mapper.ts       # Domain <-> TypeORM entity
      migrations/
      database.module.ts
    http/
      controllers/
        analysis.controller.ts          # REST API for analysis results
        sandbox.controller.ts           # Dev testing endpoint
        health.controller.ts
      http.module.ts
```

## Domain Model

### AnalysisResult Aggregate

Lifecycle: `pending -> in_progress -> completed | failed`

```typescript
const analysis = AnalysisResult.create({
  invitationId, candidateId, templateId, templateTitle, companyName,
});
analysis.start();              // -> in_progress, emits AnalysisStartedEvent
// ... per-question analysis ...
analysis.addQuestionAnalysis({ questionId, score, feedback, criteriaScores, ... });
// ... summary generation ...
analysis.complete({            // -> completed, emits AnalysisCompletedEvent
  summary, strengths, weaknesses, recommendation,
  modelUsed, totalTokensUsed, processingTimeMs, language,
});
// OR on failure:
analysis.fail(errorMessage);   // -> failed, emits AnalysisFailedEvent
```

### Scoring System

- **Per-question score**: 0-100, calculated from 4 equally-weighted criteria (0.25 each):
  - `relevance` -- how well the answer addresses the question
  - `completeness` -- coverage of key points
  - `clarity` -- communication quality
  - `depth` -- level of insight and expertise
- **Overall score**: Average of all per-question scores
- **Recommendation thresholds**:
  - `hire`: Average score >= 75 AND no critical weaknesses
  - `consider`: Average score 50-74 OR has some concerns
  - `reject`: Average score < 50 OR has major red flags

### Idempotency

The `ProcessedEvent` entity tracks consumed Kafka event IDs:

```typescript
@Entity('processed_events')
@Unique(['eventId', 'serviceName'])
export class ProcessedEventEntity {
  eventId: string;
  serviceName: string;  // 'ai-analysis-service'
  processedAt: Date;
}
```

Before processing any event, the consumer checks this table. If the event was already processed, it skips silently.

## Ports & Adapters

### Application Ports (Interfaces)

```typescript
// IAnalysisEngine -- abstraction over LLM provider
export const ANALYSIS_ENGINE = Symbol('IAnalysisEngine');
export interface IAnalysisEngine {
  analyzeResponse(input: QuestionAnalysisInput): Promise<QuestionAnalysisOutput>;
  generateSummary(input: SummaryInput): Promise<SummaryOutput>;
}

// IEventPublisher -- abstraction over Kafka
export const EVENT_PUBLISHER = Symbol('IEventPublisher');
export interface IEventPublisher {
  publish(event: DomainEventPayload): Promise<void>;
}

// IPromptLoader -- abstraction over prompt templates
export const PROMPT_LOADER = Symbol('IPromptLoader');
export interface IPromptLoader {
  getCriteria(): CriteriaConfig[];
}
```

### Infrastructure Adapters

**GroqAnalysisEngine** implements `IAnalysisEngine`:
- Uses Groq Cloud API (`https://api.groq.com/openai/v1/chat/completions`)
- Model: configurable via `GROQ_MODEL` env var (default: `openai/gpt-oss-120b`)
- Temperature: 0.3 (low for consistent, deterministic analysis)
- Response format: `{ type: 'json_object' }` for structured output
- Rate limiting: 5s delay between LLM calls (Groq free tier: 8000 TPM)
- Retry logic: Max 3 retries on 429 with exponential backoff, parses `try again in X.XXs` from error message
- Daily limit detection: Detects TPD (tokens per day) limits and throws non-retriable error
- Chunked summaries: For 30+ questions, splits into chunks of 15, generates mini-summaries, then a final combined summary

### Injection Pattern

```typescript
// In handler:
@Inject(ANALYSIS_ENGINE) private readonly analysisEngine: IAnalysisEngine,
@Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
@Inject(PROMPT_LOADER) private readonly promptLoader: IPromptLoader,

// In LLM module:
{ provide: ANALYSIS_ENGINE, useClass: GroqAnalysisEngine }
```

## Analysis Flow

```
1. Kafka consumer receives invitation.completed event
2. Idempotency check (processed_events table)
3. Check if analysis already exists for this invitation
4. Create AnalysisResult aggregate (status: pending)
5. Start analysis (status: in_progress), persist, publish AnalysisStartedEvent
6. For each question/response pair:
   a. Wait 5s (rate limiting)
   b. Call GroqAnalysisEngine.analyzeResponse()
   c. Parse JSON response (score, feedback, criteriaScores)
   d. Add QuestionAnalysis to aggregate
7. Generate summary via GroqAnalysisEngine.generateSummary()
   - For <= 30 questions: single LLM call
   - For > 30 questions: chunked approach (mini-summaries -> final summary)
8. Complete analysis (status: completed), persist, publish AnalysisCompletedEvent
9. Mark event as processed (idempotency)
10. On failure: analysis.fail(errorMessage), persist, publish AnalysisFailedEvent
```

## Sandbox Controller

Available in development for testing analysis without Kafka:
```
POST /sandbox/analyze -- manually trigger analysis with test data
```

## Commands

```bash
cd apps/ai-analysis-service
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
| PORT | Server port (default: 8005) |
| DATABASE_HOST | PostgreSQL host |
| DATABASE_PORT | PostgreSQL port (default: 5432) |
| DATABASE_NAME | Database name (ai_video_interview_analysis) |
| DATABASE_USER | Database username |
| DATABASE_PASSWORD | Database password |
| KAFKA_BROKERS | Kafka broker addresses |
| GROQ_API_KEY | Groq Cloud API key |
| GROQ_MODEL | LLM model name (default: openai/gpt-oss-120b) |
| REDIS_HOST | Redis host for BullMQ |

## Testing

- **Domain layer**: Test AnalysisResult aggregate lifecycle, Score value object bounds (0-100), Recommendation threshold logic
- **Application layer**: Mock IAnalysisEngine, test handler orchestration, verify correct state transitions on success and failure
- **Integration**: Test Kafka consumer with real messages, verify idempotency, test DB persistence

---

## Skills & Best Practices

### LLM Integration Patterns (Ports & Adapters)

- **Port abstraction**: Define the `IAnalysisEngine` port at the application layer, not the infrastructure layer. The port specifies WHAT the engine does (analyze a response, generate a summary) without caring HOW. This allows swapping Groq for OpenAI, Anthropic, or a local model by changing only the infrastructure adapter.
- **Adapter isolation**: The `GroqAnalysisEngine` class handles all Groq-specific concerns: API endpoint, authentication, request format, response parsing, rate limiting, retries. No Groq imports should appear outside the `infrastructure/llm/` directory.
- **Symbol-based injection tokens**: Use `Symbol('IAnalysisEngine')` as the injection token, not a string. This prevents accidental naming collisions and provides better type safety. Register in the module: `{ provide: ANALYSIS_ENGINE, useClass: GroqAnalysisEngine }`.
- **Fallback adapters**: Consider implementing a `MockAnalysisEngine` for development that returns deterministic scores. Register it conditionally based on environment: `useClass: process.env.USE_MOCK_LLM ? MockAnalysisEngine : GroqAnalysisEngine`.
- **Interface versioning**: When the analysis engine interface changes, update the port interface and all adapters simultaneously. Use TypeScript's type system to catch missing implementations at compile time.

### Groq API Best Practices

- **Rate limiting**: Groq free tier allows ~8000 tokens per minute (TPM) and limited requests per minute (RPM). Insert 5-second delays between LLM calls. For production, upgrade to the Developer tier and implement dynamic rate limiting based on response headers.
- **Token budgeting**: Set `max_tokens: 2000` to cap response length. Monitor `usage.total_tokens` from each response and track cumulative usage. For long interviews (30+ questions), the total token usage can reach tens of thousands -- use the chunked summary approach to stay within limits.
- **Model selection**: Use `openai/gpt-oss-120b` (or `llama-3.3-70b-versatile`) for production analysis. For development/testing, use a smaller model like `llama-3.1-8b-instant` for faster responses and lower costs. Configure via `GROQ_MODEL` environment variable.
- **Error handling**: Handle three types of Groq errors differently:
  - 429 (rate limit, per-minute): Retry with exponential backoff, parse delay from error message
  - 429 (daily limit, TPD): Do NOT retry, throw a descriptive error, suggest trying tomorrow
  - 5xx (server error): Retry up to 3 times with exponential backoff
  - 4xx other: Do not retry, log the error, fail the analysis
- **Retries with backoff**: Parse the `try again in X.XXs` message from Groq 429 responses to get the exact wait time. Add a 500ms buffer. If parsing fails, fall back to `(retryCount + 1) * 3000` ms.

### Prompt Engineering Best Practices

- **System prompts**: Use detailed system prompts that specify the exact JSON response structure, scoring guidelines with ranges (90-100: exceptional, 75-89: good, etc.), and criteria definitions. The LLM must know the expected output format before seeing the user prompt.
- **JSON mode**: Always set `response_format: { type: 'json_object' }` when expecting structured output. This constrains the LLM to produce valid JSON. Still validate and parse with try/catch -- malformed JSON can still occur.
- **Temperature tuning**: Use `temperature: 0.3` for analysis tasks that require consistency and objectness. Lower temperatures produce more deterministic, focused outputs. Avoid `temperature: 0` which can cause repetitive outputs.
- **Prompt structure**: Follow the pattern: system prompt (role + output format + guidelines) -> user prompt (context + data + instruction). Keep prompts concise -- large prompts increase token cost and latency. For the question analysis prompt, include: question text, question type, candidate response, and (optionally) correct answer.
- **Defensive parsing**: Always wrap JSON parsing in try/catch. Provide fallback values for missing fields: `parsed.feedback || 'No feedback provided'`. Clamp scores to valid range: `Math.min(100, Math.max(0, Math.round(parsed.score)))`. Validate recommendation against allowed values: `['hire', 'consider', 'reject'].includes(recommendation)`.
- **Chunked processing for large inputs**: When the interview has 30+ questions, the single-summary prompt can exceed token limits or produce degraded output. Split into chunks of 15 questions, generate mini-summaries for each chunk, then combine mini-summaries into a final summary. This reduces per-call token usage and improves output quality.

### Idempotent Event Processing

- **Exactly-once semantics**: Implement at-least-once delivery from Kafka (auto-commit after processing) combined with application-level deduplication via the `processed_events` table. The unique constraint on `(eventId, serviceName)` prevents processing the same event twice.
- **Deduplication strategies**: Check two conditions before processing: (1) event ID not in `processed_events` table, (2) analysis result not already existing for this `invitationId`. Both checks are necessary because the first protects against duplicate Kafka messages and the second protects against duplicate analysis triggers from different event IDs.
- **Idempotency window**: The `processed_events` table grows over time. Consider adding a TTL or periodic cleanup of entries older than 30 days. Events older than the retention period cannot be replayed anyway.
- **Transaction boundaries**: Ideally, mark the event as processed in the same transaction that saves the analysis result. If this is not possible, mark as processed AFTER the analysis is saved (not before), so a crash between the two steps results in re-processing rather than lost data.

### Async Processing Patterns

- **Long-running analysis**: A full interview analysis (10 questions + summary) takes 60-120 seconds due to rate limiting between LLM calls. Design the system for asynchronous processing: the Kafka consumer triggers the analysis, the result is persisted when complete, and the frontend polls for results.
- **Progress tracking**: The analysis goes through states (pending -> in_progress -> completed/failed). Persist state transitions so the frontend can show progress. Consider adding a `questionsAnalyzed` counter to the persisted entity for more granular progress.
- **Timeout handling**: Set a maximum processing time per analysis (e.g., 10 minutes). If exceeded, fail the analysis with a timeout error. This prevents stuck analyses from blocking the consumer.
- **Failure recovery**: On failure, the analysis is saved with status `failed` and `errorMessage`. The `retry-analysis` command allows manual retry. Failed analyses can also be automatically retried by a scheduled job that scans for recent failures.

### Scoring Algorithm Design

- **Weighted criteria**: Each question is scored on 4 criteria (relevance, completeness, clarity, depth), each weighted 0.25. This equal weighting can be customized per question type -- technical questions might weight depth higher, behavioral questions might weight clarity higher.
- **Score normalization**: Clamp raw LLM scores to 0-100 range. Round to integers for consistency. The Score value object enforces this: `Score.create(value)` throws if value is outside bounds.
- **Recommendation calibration**: The thresholds (hire >= 75, consider >= 50, reject < 50) should be calibrated against real interview data. Consider making these configurable via environment variables or a configuration table rather than hardcoded values.
- **Overall score**: Use arithmetic mean of per-question scores. For interviews where some questions are more important, consider weighted averaging with question-level weights.

### Cost Optimization

- **Batching**: Process all questions for an interview in a single analysis run rather than separate runs. This amortizes the summary generation cost across all questions.
- **Caching**: Cache analysis results by `invitationId`. Since analyses are deterministic for the same input (temperature 0.3), re-running is wasteful. The idempotency check already prevents this.
- **Model tier selection**: Use smaller models (8B parameter) for development and testing. Use larger models (70B+) only for production analysis. Track token usage per analysis to monitor costs.
- **Prompt optimization**: Keep prompts as short as possible while maintaining output quality. Remove redundant instructions. For the summary prompt, truncate question texts to the first 100 characters if they are very long.
- **Rate limit awareness**: Track remaining rate limit quota from response headers. When approaching limits, increase delays between calls dynamically rather than failing and retrying.

### Testing LLM Integrations

- **Mocking LLM responses**: Create a `MockAnalysisEngine` that implements `IAnalysisEngine` and returns deterministic responses. Use it in unit and integration tests. Vary the mock responses based on input (e.g., return high scores for "correct" answers, low scores for empty answers).
- **Snapshot testing**: For prompt generation, use snapshot tests to detect unintended prompt changes. Store the expected system prompt and user prompt as snapshots. Any changes to prompts should be intentional and reviewed.
- **Deterministic tests**: Since LLM outputs are non-deterministic, test the parsing and scoring logic separately from the LLM call. Test `parseQuestionAnalysisResponse()` with known JSON inputs. Test `parseSummaryResponse()` with edge cases (missing fields, invalid recommendation values).
- **Integration tests with real LLM**: Write a small set of integration tests that call the real Groq API with predefined inputs. Mark these as slow tests (`@Slow` or `--testPathPattern integration`). Run them in CI on a schedule, not on every push.
- **Error scenario tests**: Test rate limit handling (mock a 429 response, verify retry behavior). Test daily limit detection. Test malformed JSON responses. Test network timeouts. Test the full failure flow (analysis fails, status set to `failed`, AnalysisFailedEvent emitted).
- **Aggregate lifecycle tests**: Test the full AnalysisResult aggregate lifecycle: create -> start -> addQuestionAnalysis (multiple) -> complete. Test the failure path: create -> start -> fail. Verify all domain events are emitted correctly at each transition.

### Security & Data Protection (AI Analysis Specific)

- **PII in prompts**: Candidate responses may contain personal information (names, emails, phone numbers). The LLM prompt should NOT include candidate identity — only the question text and response text. Strip any PII-like patterns from responses before sending to the LLM if possible.
- **Prompt injection defense**: Candidate responses are untrusted input passed to an LLM. Use system prompts that clearly separate instructions from data. Prefix user content with delimiters: `### CANDIDATE RESPONSE START ###`. Monitor for anomalous scores (all 100s or all 0s) which may indicate prompt injection attempts.
- **Data retention**: Analysis results contain AI-generated feedback about candidates. Define a retention policy: delete analyses older than the data retention period (GDPR typically 6 months after position is filled). Implement a cleanup job.
- **Audit trail**: Log every analysis execution: who triggered it, which model was used, how many tokens consumed, what recommendation was made. This is important for explaining AI decisions to candidates (GDPR right to explanation).

### Resilience Patterns (AI Analysis Specific)

- **Groq API unavailability**: If Groq is completely down (not just rate-limited), the analysis should be marked as `failed` with a clear error message. A scheduled job should scan for recent failures and attempt automatic retry after a backoff period (e.g., 15 minutes).
- **Token budget management**: Track daily token usage. If approaching the daily limit (Groq free tier), queue remaining analyses for the next day rather than failing them. Implement a priority queue: paid tenant analyses run first, free tier analyses run when capacity allows.
- **Partial failure handling**: If the analysis succeeds for 8/10 questions but fails on questions 9-10, save the partial results and mark as `partial_failure`. This is better than losing all analysis. Allow retry of only the failed questions.
- **Consumer thread safety**: The Kafka consumer processes one message at a time (concurrency = 1) due to Groq rate limits. If a message takes > 5 minutes, heartbeat periodically to prevent consumer eviction. If a message takes > 10 minutes, timeout and fail the analysis.
- **Observability for LLM calls**: Instrument every Groq API call with OpenTelemetry spans. Track: model name, prompt token count, completion token count, latency, status (success/rate_limited/error). This data is essential for capacity planning and cost monitoring.

### Kafka Consumer Patterns (AI Analysis Specific)

- **Single consumer, no auto-commit**: Use manual commit mode. Commit the offset ONLY after the analysis is fully persisted. This ensures a crash during processing results in re-processing, not data loss.
- **Backpressure via rate limiting**: The 5-second delay between LLM calls is the primary backpressure mechanism. If Kafka messages arrive faster than they can be processed, they naturally queue in Kafka. Monitor consumer lag to detect when you're falling behind.
- **Idempotency is critical**: Because analysis takes minutes and can fail midway, the consumer will inevitably re-process some messages. The dual idempotency check (processed_events table + existing analysis by invitationId) ensures no duplicate analyses are created.
- **Event data preservation**: Store the original `InvitationCompletedEvent` payload alongside the analysis result. This enables: retry analysis without re-fetching from Interview Service, debugging analysis quality issues, and audit trail compliance.
