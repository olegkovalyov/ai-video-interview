import { AnalysisStartedEvent } from '../analysis-started.event';
import { AnalysisCompletedEvent } from '../analysis-completed.event';
import { AnalysisFailedEvent } from '../analysis-failed.event';

describe('Domain Events', () => {
  describe('AnalysisStartedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new AnalysisStartedEvent('analysis-123', 'invitation-456');

      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe('analysis-123');
      expect(event.invitationId).toBe('invitation-456');
    });

    it('should generate unique eventId for each instance', () => {
      const event1 = new AnalysisStartedEvent('a1', 'i1');
      const event2 = new AnalysisStartedEvent('a1', 'i1');

      expect(event1.eventId).not.toBe(event2.eventId);
    });
  });

  describe('AnalysisCompletedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new AnalysisCompletedEvent(
        'analysis-123',
        'invitation-456',
        85,
        'hire',
        10,
      );

      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe('analysis-123');
      expect(event.invitationId).toBe('invitation-456');
      expect(event.overallScore).toBe(85);
      expect(event.recommendation).toBe('hire');
      expect(event.questionsAnalyzed).toBe(10);
    });

    it('should generate unique eventId for each instance', () => {
      const event1 = new AnalysisCompletedEvent('a1', 'i1', 80, 'hire', 5);
      const event2 = new AnalysisCompletedEvent('a1', 'i1', 80, 'hire', 5);

      expect(event1.eventId).not.toBe(event2.eventId);
    });
  });

  describe('AnalysisFailedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new AnalysisFailedEvent(
        'analysis-123',
        'invitation-456',
        'Rate limit exceeded',
      );

      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe('analysis-123');
      expect(event.invitationId).toBe('invitation-456');
      expect(event.errorMessage).toBe('Rate limit exceeded');
    });

    it('should generate unique eventId for each instance', () => {
      const event1 = new AnalysisFailedEvent('a1', 'i1', 'error');
      const event2 = new AnalysisFailedEvent('a1', 'i1', 'error');

      expect(event1.eventId).not.toBe(event2.eventId);
    });
  });
});
