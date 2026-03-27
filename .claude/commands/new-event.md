Create a new Kafka Integration Event for $ARGUMENTS.

Follow these steps in order:

## 1. Event Contract (packages/shared)

Create the event interface in `packages/shared/src/events/`:
- File: `<entity>-<action>.event.ts` (e.g., `interview-completed.event.ts`)
- Follow BaseEvent envelope: `{ eventId, eventType, timestamp, version, source, payload }`
- Event type naming: past-tense dotted (e.g., `interview.completed`)
- Include all data the consumer needs (fat events)
- Export from `packages/shared/src/events/index.ts`

## 2. Topic Registration

Check if a new Kafka topic is needed:
- If event fits existing topic (`user-events`, `interview-events`, `analysis-events`) — use it
- If new topic needed — add to `KAFKA_TOPICS` constant in `packages/shared`
- Every new topic needs a DLQ: `<topic>-dlq`

## 3. Producer (Source Service)

In the producing service:
- Create domain event in `src/domain/events/`
- Emit domain event from aggregate method
- Add Outbox entry in the command handler (same transaction as aggregate save)
- Map domain event → integration event in the outbox processor
- Use aggregate ID as Kafka partition key

## 4. Consumer (Target Service)

In the consuming service:
- Create Kafka consumer in `src/infrastructure/kafka/consumers/`
- Register in the service's Kafka module
- Implement idempotency: check `processed_events` table before processing
- Mark event as processed after successful handling
- Add error handling → DLQ after 3 retries
- Propagate correlation ID from Kafka headers

## 5. Verification

- Ensure the event is exported from `packages/shared`
- Check TypeScript compilation: `npx tsc --noEmit` in both services
- Verify consumer group naming follows convention: `<service-name>`
