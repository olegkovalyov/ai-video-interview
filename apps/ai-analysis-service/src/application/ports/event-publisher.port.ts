export const EVENT_PUBLISHER = Symbol('IEventPublisher');

export interface AnalysisEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}

export interface IEventPublisher {
  publish(event: AnalysisEvent): Promise<void>;
}
