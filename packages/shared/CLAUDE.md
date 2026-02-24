# Shared Package (@repo/shared)

## Overview

Cross-cutting shared package providing the single source of truth for inter-service communication contracts. Contains Kafka event type definitions and factories, KafkaService and KafkaHealthService utilities, OpenTelemetry trace context propagation, and auto-generated API type contracts from OpenAPI specs.

- **Package name**: `@repo/shared`
- **Build**: `tsc -b` (TypeScript project references)
- **Runtime dependency**: `kafkajs` (peer: `@opentelemetry/api`)

## Commands

```bash
pnpm --filter @repo/shared build        # Compile TypeScript to dist/
pnpm --filter @repo/shared dev          # Watch mode (tsc -b --watch)
pnpm --filter @repo/shared lint         # ESLint
pnpm --filter @repo/shared check-types  # Type check without emit
```

## Export Paths

```typescript
// Main entry -- events, Kafka services, tracing
import { UserCommandFactory, KafkaService, KAFKA_TOPICS } from '@repo/shared';

// Interview Service generated contracts
import { CreateTemplateDto, InvitationResponseDto } from '@repo/shared/contracts/interview-service';

// User Service generated contracts
import { UserResponseDto, SkillDto } from '@repo/shared/contracts/user-service';
```

## Directory Structure

```
packages/shared/
  src/
    index.ts                  # Main barrel export (events, kafka, tracing)
    events/
      index.ts                # KAFKA_CONFIG, KAFKA_TOPICS constants
      user.events.ts          # User domain events: commands, integration events, auth events, factories
      analysis.events.ts      # AI Analysis events: AnalysisCompletedEvent, AnalysisFailedEvent
    kafka/
      kafka.service.ts        # KafkaService: producer, consumer, publish, subscribe, DLQ handling
      kafka-health.service.ts # KafkaHealthService: health checks, consumer lag, group management
    tracing/
      kafka-propagation.ts    # OpenTelemetry W3C trace context inject/extract for Kafka headers
    contracts/                # AUTO-GENERATED -- DO NOT EDIT MANUALLY
      interview-service/      # Types generated from Interview Service OpenAPI spec
      user-service/           # Types generated from User Service OpenAPI spec
  dist/                       # Compiled output
```

## Event Architecture

### Event Categories

| Category | Topic | Naming Convention | Direction | Example |
|----------|-------|-------------------|-----------|---------|
| Commands | `user-commands` | Imperative present (`user.create`) | API Gateway -> Service | `UserCreateCommand` |
| Integration Events | `user-events` | Past tense (`user.created`) | Service -> All consumers | `UserCreatedEvent` |
| Auth Events | `auth-events` | Past tense (`user.authenticated`) | API Gateway -> Services | `UserAuthenticatedEvent` |
| Analysis Events | `analysis-events` | Past tense (`analysis.completed`) | AI Analysis -> Services | `AnalysisCompletedEvent` |

### BaseEvent Contract

All events extend `BaseEvent`:

```typescript
interface BaseEvent {
  eventId: string;       // UUID v4, unique per event instance
  eventType: string;     // Dot-notation: 'domain.action' (e.g., 'user.create')
  timestamp: number;     // Unix timestamp in milliseconds (Date.now())
  version: string;       // Schema version (e.g., '1.0')
  source: string;        // Producing service name ('api-gateway', 'user-service', etc.)
}
```

### Kafka Topics

Defined in `KAFKA_TOPICS` constant:

- `user-commands` / `user-commands-dlq` -- Commands to User Service
- `interview-commands` / `interview-commands-dlq` -- Commands to Interview Service
- `auth-events` / `auth-events-dlq` -- Authentication events from API Gateway
- `user-events` / `user-events-dlq` -- Integration events from User Service
- `interview-events` / `interview-events-dlq` -- Integration events from Interview Service
- `analysis-events` / `analysis-events-dlq` -- Events from AI Analysis Service
- `user-analytics` / `user-analytics-dlq` -- Analytics events

### Event Factory Classes

- **`UserCommandFactory`**: Static factory methods for creating user commands with proper defaults. Used by API Gateway to publish commands.
  - `createUserCreate()`, `createUserUpdate()`, `createUserDelete()`, `createUserSuspend()`, `createUserActivate()`, `createUserAssignRole()`, `createUserRemoveRole()`
- **`AuthEventFactory`**: Static factory methods for auth events.
  - `createUserAuthenticated()`, `createUserLoggedOut()`

Factories handle `eventId` generation (`crypto.randomUUID()`), `timestamp` (`Date.now()`), `version`, and `source` automatically.

### Union Types

Discriminated union types enable exhaustive `switch` statements on `eventType`:

```typescript
type UserCommand = UserCreateCommand | UserUpdateCommand | UserDeleteCommand | ...;
type UserIntegrationEvent = UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent | ...;
type UserAuthEvent = UserAuthenticatedEvent | UserLoggedOutEvent;
type AnalysisEvent = AnalysisCompletedEvent | AnalysisFailedEvent;
```

## KafkaService

Shared Kafka client wrapper used by all backend services:

- **Producer**: Idempotent, `maxInFlightRequests: 1`, automatic retry with backoff
- **Consumer**: Configurable auto-commit or manual commit (batch mode), heartbeat handling for long-running tasks (`sessionTimeout: 600000` for analysis)
- **`publishEvent(topic, event, headers?, options?)`**: Publishes typed events with partition key (defaults to `payload.userId` or `eventId`)
- **`subscribe(topic, groupId, handler, options?)`**: Subscribes with `eachMessage` (default) or `eachBatch` mode
- **DLQ handling**: After 3 failed processing attempts, messages are sent to `<topic>-dlq` with original message, error details, and retry count in headers
- **`parseEvent<T>(message)`**: Safely parses Kafka message value to typed event

## KafkaHealthService

Admin client for monitoring Kafka infrastructure:

- `checkHealth()` -- Returns broker connectivity, topic list, consumer group states, and consumer lag
- `getConsumerGroupLag(groupId)` -- Returns per-partition lag for a consumer group
- `resetConsumerGroup(groupId, topic?)` -- Resets consumer offsets to earliest

## OpenTelemetry Trace Propagation

Functions for propagating W3C Trace Context across Kafka messages:

- `injectTraceContext(headers?)` -- Adds `traceparent` header from active span to outgoing Kafka message headers
- `extractTraceContext(headers?)` -- Restores trace context from incoming Kafka message headers
- `withKafkaTracing(tracerName, operationName, headers, attributes, fn)` -- Wraps a Kafka message handler in a new span linked to the producer's trace
- `getTraceInfo()` -- Returns current `traceId` and `spanId` for logging correlation

## Generated Contracts

Files in `src/contracts/` (and `dist/contracts/`) are **auto-generated from OpenAPI specs**. **DO NOT EDIT MANUALLY.** To regenerate, run the contract generation script from the monorepo root after updating the corresponding service's Swagger/OpenAPI spec.

### Available Contracts

**Interview Service** (`@repo/shared/contracts/interview-service`):
- `interview-service.generated.ts` -- All DTOs and types
- `types.ts` -- Re-exported type aliases

**User Service** (`@repo/shared/contracts/user-service`):
- `user-service.generated.ts` -- All DTOs and types
- `candidates.types.ts`, `companies.types.ts`, `users.types.ts`, `skills.types.ts` -- Domain-specific types
- `common.types.ts` -- Shared types (pagination, error responses)
- `health.types.ts`, `metrics.types.ts` -- Infrastructure types

## Rules

1. **Events are the contract** -- All inter-service communication types MUST be defined here. Services never define their own event shapes inline.
2. **Factories over raw construction** -- Always use `UserCommandFactory` or `AuthEventFactory` to create events. Never manually construct event objects.
3. **Never edit contracts/** -- Generated files are overwritten by the code generation pipeline.
4. **Additive changes only** -- When evolving event schemas, add new optional fields. Never remove or rename existing fields (backward compatibility).
5. **Build before consuming** -- Run `pnpm --filter @repo/shared build` after changes. Consuming services import from `dist/`.

## Skills & Best Practices

### Event Contract Design

- **Schema evolution**: Treat event schemas as public APIs. Follow the "only add, never remove" principle. When an event needs a breaking change, create a new event type (e.g., `user.created.v2`) rather than modifying the existing one. Set the `version` field to track schema versions.
- **Versioning strategy**: The `version` field in `BaseEvent` is a string (e.g., `'1.0'`). Consumers should check the version and handle unknown versions gracefully (log a warning, skip processing, or fall back to a default handler). Never fail hard on an unrecognized version.
- **Backward compatibility**: New fields must be optional (`?`). Consumers must handle missing optional fields with sensible defaults. When deprecating a field, keep it in the schema for at least two release cycles and add a `@deprecated` JSDoc annotation.
- **Event naming**: Use dot-notation `domain.action`. Commands are imperative present tense (`user.create`, `user.suspend`). Integration events are past tense (`user.created`, `user.suspended`). This naming convention makes intent clear and avoids ambiguity.
- **Payload design**: Keep payloads self-contained -- include all data the consumer needs. Avoid payloads that require the consumer to make additional API calls (event enrichment). For example, `UserCreatedEvent` includes `email`, `firstName`, `lastName`, not just `userId`.
- **Idempotency**: Every event has a unique `eventId` (UUID v4). Consumers must store processed `eventId` values and skip duplicates. This is critical because Kafka guarantees at-least-once delivery, not exactly-once.
- **Event ordering**: Use `payload.userId` (or the relevant entity ID) as the Kafka partition key. This guarantees ordered delivery of all events for a given user within a partition. Never use random keys if order matters.
- **Dead letter queues**: Every topic has a corresponding `-dlq` topic. After 3 failed processing attempts, the message is forwarded to the DLQ with error metadata. Monitor DLQ depth as an operational alert.

### Kafka Configuration Best Practices

- **Consumer groups**: Each microservice uses its own consumer group (`<service-name>`). This ensures each service gets its own copy of every message. Within a service, use a single consumer group for all instances to distribute load.
- **Partition strategy**: Use entity IDs (userId, invitationId) as partition keys for ordered delivery per entity. Set topic partition counts based on expected consumer parallelism (one partition per consumer instance). Start with 3-6 partitions per topic; increase is easy, decrease is not.
- **Serialization**: Events are JSON-serialized (`JSON.stringify`/`JSON.parse`). The `parseEvent<T>()` method handles deserialization with error logging. For production, consider adding JSON Schema validation on consumption to catch malformed events early.
- **Compression**: Enable `lz4` or `snappy` compression at the producer level for topics with high throughput. Compression is transparent to consumers. For this project's scale, compression is optional but recommended for `user-analytics` events.
- **Idempotent producer**: The `KafkaService` producer is configured with `idempotent: true` and `maxInFlightRequests: 1`. This prevents duplicate messages from producer retries at the cost of slightly lower throughput. Always keep this enabled.
- **Session and heartbeat timeouts**: For long-running consumers (AI analysis: minutes per message), set `sessionTimeout` high enough (600,000ms = 10 minutes) with `heartbeatInterval` at most one-third of `sessionTimeout`. Call `heartbeat()` during long processing to prevent consumer eviction.
- **Manual commit for critical processing**: Use `eachBatch` mode with `autoCommit: false` for operations where losing a message is unacceptable (e.g., transcription jobs, analysis). Commit offsets only after successful processing and persistence.
- **DLQ pattern**: The `sendToDLQ` method preserves the original message, error details, retry count, and service name. Monitor DLQ topics with alerts. Build a simple admin UI or CLI tool to inspect and replay DLQ messages.

### OpenTelemetry Trace Context Propagation

- **W3C Trace Context**: The `traceparent` header follows the W3C standard format: `00-{traceId}-{spanId}-{flags}`. This ensures compatibility with any OpenTelemetry-compatible tracing backend (Jaeger, Zipkin, Tempo, etc.).
- **Producer-side injection**: Before publishing a Kafka event, call `injectTraceContext()` to capture the current span's trace context and inject it as a `traceparent` header on the Kafka message. This connects the producer's trace to the consumer's trace.
- **Consumer-side extraction**: In Kafka consumers, use `withKafkaTracing()` to create a new span that is a child of the producer's span. This creates an end-to-end trace from API request through Kafka to consumer processing.
- **Attribute conventions**: Set `messaging.system: 'kafka'`, `messaging.destination: <topic>`, `messaging.operation: 'process'` as span attributes. Add domain-specific attributes (e.g., `user.id`, `event.type`) for searchability in the tracing UI.
- **Error recording**: The `withKafkaTracing` wrapper automatically records exceptions on the span and sets the span status to `ERROR`. This surfaces failed message processing in the tracing UI without manual instrumentation.
- **Correlation logging**: Use `getTraceInfo()` to include `traceId` and `spanId` in log messages. This enables correlating logs with traces in observability platforms (e.g., search Grafana Loki by `traceId` to find all logs for a request).

### Shared Package Management

- **Avoiding circular dependencies**: This package depends only on `kafkajs` and `@opentelemetry/api`. It never imports from application services. Services import from this package, not the other way around. If you find yourself wanting to import a service type here, create an interface/type in this package instead and have the service implement it.
- **Minimal API surface**: Export only what other services need. Internal helpers should not be exported. Use the barrel `index.ts` to control the public API. The separate export paths (`./contracts/interview-service`, `./contracts/user-service`) keep contract imports isolated.
- **Build pipeline**: This package must be built (`tsc -b`) before consuming services can use it. In the monorepo, Turborepo handles this dependency ordering automatically. In CI, ensure `@repo/shared` builds before all backend services.
- **Semver discipline**: Although this is a private monorepo package (version `0.0.0`), treat changes with semver thinking. Adding a new event type is a minor/patch change. Removing or renaming an event field is a breaking change that requires updating all consumers.
- **Testing contracts**: Write unit tests for factory classes to ensure they produce valid event shapes. Test that all required `BaseEvent` fields are populated. Test union type exhaustiveness in consumer switch statements.

### Type-Safe Event Factories

- **Discriminated unions**: The `eventType` literal string acts as the discriminant. TypeScript narrows the union type in `switch` statements:
  ```typescript
  function handleEvent(event: UserCommand) {
    switch (event.eventType) {
      case 'user.create':
        // TypeScript knows event is UserCreateCommand here
        console.log(event.payload.email);
        break;
      case 'user.delete':
        // TypeScript knows event is UserDeleteCommand here
        console.log(event.payload.deletedBy);
        break;
    }
  }
  ```
- **Exhaustive checks**: Add a `default` case with `never` assertion to catch unhandled event types at compile time:
  ```typescript
  default: {
    const _exhaustive: never = event;
    throw new Error(`Unhandled event type: ${(event as BaseEvent).eventType}`);
  }
  ```
- **Factory guarantees**: Factories ensure `eventId` is always a fresh UUID, `timestamp` is always current, `version` is always set, and `source` is always the calling service name. This eliminates a class of bugs where consumers receive events with missing metadata.
- **Type narrowing in consumers**: When parsing Kafka messages, parse to the union type first, then switch on `eventType`. Never parse directly to a specific event subtype -- the message could be any event in the union.
- **Extending with new events**: When adding a new event type: (1) define the interface extending `BaseEvent`, (2) add it to the union type, (3) add a factory method, (4) update all consumer `switch` statements (the `never` exhaustive check will flag missing cases at compile time).

### Cross-Service Contract Patterns

- **Event catalog**: Maintain a mental model of all event flows. The primary flows are: (1) API Gateway → `user-commands` → User Service → `user-events` → consumers, (2) Interview Service → `interview-events` → AI Analysis → `analysis-events` → Interview Service. When adding a new event, check if it fits an existing flow or needs a new topic.
- **Payload size limits**: Kafka messages should stay under 1MB (configurable, but smaller is better). The `InvitationCompletedEvent` with 50 questions and responses approaches this limit. If payloads grow larger, consider referencing data by ID and having the consumer fetch it, or compressing the payload.
- **Event deduplication across services**: Each consuming service has its own `processed_events` table with `(eventId, serviceName)` uniqueness. This means the same event can be processed by multiple services (by design) but not twice by the same service. When adding a new consumer, always implement this pattern.
- **Backward-compatible defaults**: When adding optional fields to events, always document the default value consumers should use when the field is missing. Example: if adding `language?: string` to an event, document that consumers should default to `'en'` when not present.
- **Testing event factories**: Every factory method should have a unit test verifying: (1) `eventId` is a valid UUID, (2) `timestamp` is a recent number, (3) `version` is set, (4) `source` is correct, (5) `eventType` matches the expected string literal, (6) payload fields are correctly mapped.

### KafkaService Advanced Patterns

- **Producer batching**: For high-throughput scenarios (analytics events), batch multiple messages in a single `producer.send()` call. The `publishEvent()` method sends one message at a time for reliability; create a `publishBatch()` for analytics.
- **Consumer error handling hierarchy**: (1) Transient errors (network, timeout) → retry within the consumer, (2) Deserialization errors (malformed JSON) → send to DLQ immediately, (3) Business logic errors (unknown event type) → log and skip, (4) Fatal errors (DB down) → stop consumer and alert.
- **Health check patterns**: `KafkaHealthService.checkHealth()` reports: broker connectivity, topic existence, consumer group state, and per-partition lag. Integrate this with NestJS `@nestjs/terminus` health checks for a unified `/health` endpoint. Alert if lag exceeds threshold.
- **Topic creation**: Topics are created by the `init-kafka.sh` script at infrastructure startup. Never create topics from application code (`allowAutoTopicCreation: false` on producers). This prevents typos from creating unintended topics.

### Tracing Patterns (Advanced)

- **End-to-end trace example**: A trace for "interview completion" spans: (1) Frontend `POST /invitations/:id/complete` → (2) API Gateway proxy → (3) Interview Service handler → (4) Outbox save → (5) BullMQ job → (6) Kafka publish → (7) AI Analysis consumer → (8) Groq LLM calls → (9) Analysis save → (10) Kafka publish back. Steps 1-5 share one trace. Steps 6-10 are linked via `traceparent` in Kafka headers.
- **Span naming conventions**: HTTP spans: `HTTP GET /api/v1/users/:id`. Kafka producer: `kafka.publish interview-events`. Kafka consumer: `kafka.process interview-events`. Database: `db.query SELECT users`. LLM: `llm.call groq.analyzeResponse`. These names appear in Jaeger UI.
- **Baggage propagation**: Use OpenTelemetry baggage to propagate business context (userId, tenantId) across all spans in a trace. This enables filtering traces by user in Jaeger without adding custom attributes to every span.
