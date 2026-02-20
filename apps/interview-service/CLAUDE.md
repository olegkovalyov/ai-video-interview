# Interview Service

## Overview

Domain-driven microservice responsible for interview template management and candidate invitation lifecycle. Implements DDD + CQRS + Clean Architecture with state machine patterns for template and invitation aggregates. Publishes the critical `invitation.completed` event that triggers AI analysis.

- **Port**: 8003
- **Database**: PostgreSQL 15 (`ai_video_interview_interview`)
- **Architecture**: DDD + CQRS + Clean Architecture

## Tech Stack

- NestJS 11, TypeScript 5
- @nestjs/cqrs (command/query bus, event bus)
- TypeORM 0.3 (PostgreSQL, migrations)
- kafkajs (event publishing via Outbox)
- BullMQ (Outbox job processing)
- prom-client (Prometheus metrics)
- Winston (structured logging)
- Jest 30 (testing)

## Architecture

```
src/
  domain/
    aggregates/
      interview-template.aggregate.ts   # Template lifecycle (draft->active->archived)
      invitation.aggregate.ts           # Invitation lifecycle (pending->in_progress->completed->expired)
    entities/
      question.entity.ts                # Question within a template
      response.entity.ts                # Candidate response within an invitation
    value-objects/
      template-status.vo.ts             # draft | active | archived
      invitation-status.vo.ts           # pending | in_progress | completed | expired
      question-type.vo.ts               # open | multiple_choice | technical | behavioral
      question-option.vo.ts             # Option for multiple choice questions
      interview-settings.vo.ts          # Time limits, pause settings, etc.
      response-type.vo.ts               # text | selected_option
    events/
      template-created.event.ts
      question-added.event.ts
      question-removed.event.ts
      questions-reordered.event.ts
      template-published.event.ts
      template-archived.event.ts
      invitation-created.event.ts
      invitation-started.event.ts
      response-submitted.event.ts
      invitation-completed.event.ts     # CRITICAL: triggers AI analysis
    exceptions/
    repositories/                       # Interfaces only
    base/                               # AggregateRoot, Entity, ValueObject
  application/
    commands/                           # 11 commands
      create-template/
      update-template/
      delete-template/
      publish-template/
      add-question/
      remove-question/
      reorder-questions/
      create-invitation/
      start-invitation/
      submit-response/
      complete-invitation/
    queries/                            # 6 queries
      get-template/
      list-templates/
      get-template-questions/
      get-invitation/
      list-candidate-invitations/
      list-hr-invitations/
    event-handlers/                     # Domain event handlers (outbox publishing)
    dto/
  infrastructure/
    persistence/
      entities/                         # TypeORM entities
      repositories/                     # TypeORM implementations
      mappers/                          # Domain <-> Entity mappers
      migrations/
    kafka/
    messaging/outbox/                   # Outbox pattern (same as user-service)
    http/
      controllers/
        templates.controller.ts
        invitations.controller.ts
      modules/
        templates.module.ts
        invitations.module.ts
      guards/
      decorators/
    logger/
    metrics/
```

## Domain Model

### InterviewTemplate Aggregate (State Machine)

```
  draft ---[publish()]--> active ---[archive()]--> archived
    |                                                  ^
    +----------------[archive()]----------------------+
```

**Business rules**:
- New templates start in `draft` status
- Can only publish draft templates (`canBePublished()`)
- Must have at least one question to publish
- Archived templates are immutable (no modifications, no adding/removing questions)
- Questions have an `order` field for sequencing
- Question ordering is managed by the aggregate (`reorderQuestionsByIds()` validates all IDs exist, no duplicates, all questions provided)

```typescript
// Template aggregate owns questions as child entities
export class InterviewTemplate extends AggregateRoot {
  addQuestion(question: Question): void {
    if (this.status.isArchived()) throw new Error('Cannot add questions to archived template');
    // Check for duplicate order, push question, emit event
  }

  publish(): void {
    if (!this.status.canBePublished()) throw new Error('Only draft templates can be published');
    if (this.props.questions.length === 0) throw new Error('Cannot publish template without questions');
    this.props.status = TemplateStatus.active();
    this.apply(new TemplatePublishedEvent(...));
  }
}
```

### Invitation Aggregate (State Machine)

```
  pending ---[start()]--> in_progress ---[complete()]--> completed
    |                         |
    |                         +---[expire/timeout]----> expired
    +---[expire]----> expired
```

**Business rules**:
- Only the invited candidate can start/submit/complete their invitation
- Cannot start an expired invitation (auto-transitions to expired)
- Can only submit responses when `in_progress`
- Cannot submit duplicate responses for the same question
- For manual completion: all questions must be answered (`responses.length >= totalQuestions`)
- For auto-timeout completion: completes with whatever answers exist
- `complete()` emits `InvitationCompletedEvent` with full question/response data for AI analysis

**InvitationCompletedEvent** is the critical cross-service event:
```typescript
new InvitationCompletedEvent(
  invitationId, candidateId, templateId,
  templateTitle, companyName, reason,
  responsesCount, totalQuestions, completedAt,
  language,
  questions,     // Full question data including options
  responseData,  // All candidate responses
)
```

### Question Entity

- Owned by InterviewTemplate aggregate
- Fields: id, text, type (QuestionType), order, timeLimit, options (for multiple choice)
- `updateOrder()` returns a new Question instance (immutability)
- Options stored as QuestionOption value objects

### Response Entity

- Owned by Invitation aggregate
- Fields: id, questionId, responseType, textAnswer, selectedOptionId, duration
- Created by the candidate during the interview

## Key Event Flow

```
HR creates template (draft) -> adds questions -> publishes template (active)
HR creates invitation (pending) -> candidate starts (in_progress)
Candidate submits responses one by one -> completes invitation (completed)
  -> InvitationCompletedEvent published to Kafka via Outbox
    -> AI Analysis Service consumes event and starts analysis
```

## Commands

```bash
cd apps/interview-service
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
| PORT | Server port (default: 8003) |
| DATABASE_HOST | PostgreSQL host |
| DATABASE_PORT | PostgreSQL port (default: 5432) |
| DATABASE_NAME | Database name (ai_video_interview_interview) |
| DATABASE_USER | Database username |
| DATABASE_PASSWORD | Database password |
| KAFKA_BROKERS | Kafka broker addresses |
| REDIS_HOST | Redis host for BullMQ |

## Testing

- **Domain layer**: Test state machine transitions (every valid and invalid state change), question ordering invariants, invitation access control rules
- **Application layer**: Test command handlers with mocked repositories, verify correct events emitted
- **Integration**: Test full invitation lifecycle with real database

---

## Skills & Best Practices

### State Machine Patterns for Aggregates

- **Explicit state transitions**: Define allowed transitions in the value object. `TemplateStatus.canBePublished()` returns true only for `draft`. `InvitationStatus.canBeStarted()` returns true only for `pending`. Never allow arbitrary state changes -- always go through transition methods on the aggregate.
- **Guard clauses at method entry**: Every business method starts by validating the current state. `publish()` checks `canBePublished()` and `questions.length > 0`. `submitResponse()` checks `canSubmitResponse()` and `!isExpired()`. Fail fast with descriptive domain errors.
- **Terminal states**: `archived` and `expired`/`completed` are terminal states. Once reached, no further mutations are allowed. Implement `isFinished()` helper methods on status value objects.
- **Auto-transitions**: Some transitions happen implicitly. When a pending invitation is started but has already expired, the `start()` method transitions to `expired` and throws. This prevents inconsistent states from being persisted.
- **State + behavior encapsulation**: The aggregate, not the handler, decides which transitions are valid. The handler calls `template.publish()` and the aggregate enforces all rules internally. This prevents business logic leaking into the application layer.

### Interview Domain Patterns

- **Question ordering**: Questions have an explicit `order` field (1-based). When a question is removed, remaining questions are automatically reordered by the aggregate's private `reorderQuestions()` method. The `reorderQuestionsByIds()` method validates: all IDs exist, no duplicates, all questions provided, then updates order fields.
- **Response validation**: Responses are validated within the invitation aggregate. Check for duplicate question responses before adding. The response entity stores both `textAnswer` and `selectedOptionId` to support different question types.
- **Time limits**: Interview settings (stored as InterviewSettings value object) include per-question and total time limits. The `showTimer` flag controls whether the candidate sees a countdown. Time limit enforcement happens on the frontend with server-side validation via `expiresAt`.
- **Progress tracking**: The invitation aggregate provides `getProgress()` returning `{ answered, total, percentage }`. This is derived from `responses.length / totalQuestions`. Used by the frontend to show interview progress.

### Event Choreography

- **invitation.completed -> analysis trigger**: The `InvitationCompletedEvent` is the most critical cross-service event. It carries the full question and response data so the analysis service can process independently without calling back to the interview service.
- **Event payload completeness**: Include all data needed by consumers in the event payload. The `InvitationCompletedEvent` includes `questions` (with options), `responseData` (with text answers), `templateTitle`, `companyName`, and `language`. This follows the "fat event" pattern -- consumers should not need to make additional API calls.
- **Outbox publishing in event handlers**: Domain event handlers (registered via `@EventsHandler`) save integration events to the outbox. This separates internal event handling (logging, metrics) from external event publishing (Kafka).
- **Event versioning**: Include a `version` field in event payloads. When the event schema changes, increment the version. Consumers should handle multiple versions gracefully.

### Aggregate Composition

- **Template contains questions**: Questions are child entities of the InterviewTemplate aggregate. They are loaded eagerly (via TypeORM `relations`) when the template is reconstituted. All question mutations go through the template aggregate's methods (`addQuestion()`, `removeQuestion()`, `reorderQuestionsByIds()`).
- **Invitation contains responses**: Responses are child entities of the Invitation aggregate. They are added via `submitResponse()`. The invitation knows the `totalQuestions` count to validate completion.
- **Defensive copies**: Getters for child entity collections return copies: `get questions(): Question[] { return [...this.props.questions]; }`. This prevents external code from mutating the aggregate's internal state.
- **Child entity identity**: Questions and responses have their own UUIDs but are always accessed through their parent aggregate. There is no standalone QuestionRepository -- question persistence is handled by the InterviewTemplateRepository.

### Testing State Transitions

- **Test every valid transition**: For the template state machine, test: draft->active (via publish), draft->archived, active->archived. For the invitation: pending->in_progress, in_progress->completed, pending->expired, in_progress->expired.
- **Test every invalid transition**: Verify that `publish()` on an active template throws. Verify that `start()` on a completed invitation throws. Verify that `addQuestion()` on an archived template throws.
- **Boundary conditions**: Test publish with zero questions (should fail). Test complete with `responses.length < totalQuestions` (should fail for manual, succeed for auto_timeout). Test start on an invitation that just expired.
- **Event assertion**: After each state transition, verify the correct domain event was emitted: `const events = template.getUncommittedEvents(); expect(events[0]).toBeInstanceOf(TemplatePublishedEvent);`
- **Access control in tests**: Test that only the invited candidate can start/submit/complete. Test that both candidate and HR inviter can access invitation data. Test admin bypass.

### DDD / CQRS / TypeORM / Kafka Best Practices

- **Aggregate design**: Same principles as user-service. Keep aggregates focused. InterviewTemplate manages template metadata + questions. Invitation manages the interview session + responses. They reference each other by ID (`templateId`), never by object reference.
- **CQRS read models**: For list queries (list-templates, list-hr-invitations), use read-optimized repositories that return flat DTOs directly, bypassing aggregate reconstitution. This avoids the overhead of loading full aggregates with all child entities when only summary data is needed.
- **TypeORM relations**: Template -> Questions is a one-to-many with `CASCADE` on delete. Invitation -> Responses is a one-to-many with `CASCADE`. Use `eager: false` on relations and load them explicitly when needed via `relations: ['questions']`.
- **Migration naming**: Follow the pattern: `<timestamp>-<Description>.ts`. Examples: `1730900000000-InitialSchema.ts`, `1731017000000-AddQuestionOptions.ts`. Each migration has a descriptive name explaining what it changes.
- **Kafka topic design**: Publish all interview-service events to the `interview-events` topic. Use `invitationId` as the partition key for invitation events and `templateId` for template events. Consumers filter by `eventType` field.
- **Outbox pattern**: Same implementation as user-service. OutboxService saves events to the outbox table, BullMQ processes them asynchronously, Kafka is the final destination. The OutboxScheduler handles stuck events.
- **Repository injection**: Use string tokens for repository injection: `@Inject('IInterviewTemplateRepository')`. Register in the database module: `{ provide: 'IInterviewTemplateRepository', useClass: TypeOrmInterviewTemplateRepository }`.
- **Domain exception filter**: Register `DomainExceptionFilter` globally to map domain exceptions to appropriate HTTP status codes. `TemplateNotFoundException` -> 404, `InvalidTemplateOperationException` -> 422, `DomainException` -> 400.
