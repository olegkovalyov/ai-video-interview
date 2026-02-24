/**
 * IOutboxService — Application-layer port for outbox event publishing.
 * Infrastructure provides the implementation (BullMQ + TypeORM).
 * Inject via token: @Inject('IOutboxService')
 */
export interface IOutboxService {
  saveEvent(eventType: string, payload: Record<string, unknown>, aggregateId: string): Promise<void>;
  saveEvents(events: Array<{ eventType: string; payload: Record<string, unknown>; aggregateId: string }>): Promise<void>;
}
