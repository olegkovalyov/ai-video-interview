import {
  TemplateCreatedEvent,
  QuestionAddedEvent,
  QuestionRemovedEvent,
  TemplatePublishedEvent,
  TemplateArchivedEvent,
} from '../index';

describe('Domain Events', () => {
  describe('TemplateCreatedEvent', () => {
    it('should have correct event name', () => {
      const event = new TemplateCreatedEvent(
        'template-1',
        'Test Title',
        'Test Description',
        'user-1',
      );

      expect(event.eventName).toBe('TemplateCreated');
    });

    it('should have aggregateId', () => {
      const event = new TemplateCreatedEvent(
        'template-1',
        'Test Title',
        'Test Description',
        'user-1',
      );

      expect(event.aggregateId).toBe('template-1');
    });

    it('should have title, description, createdBy', () => {
      const event = new TemplateCreatedEvent(
        'template-1',
        'Test Title',
        'Test Description',
        'user-1',
      );

      expect(event.title).toBe('Test Title');
      expect(event.description).toBe('Test Description');
      expect(event.createdBy).toBe('user-1');
    });

    it('should have occurredOn timestamp', () => {
      const before = new Date();
      const event = new TemplateCreatedEvent(
        'template-1',
        'Test Title',
        'Test Description',
        'user-1',
      );
      const after = new Date();

      expect(event.occurredOn).toBeInstanceOf(Date);
      expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should serialize to JSON', () => {
      const event = new TemplateCreatedEvent(
        'template-1',
        'Test Title',
        'Test Description',
        'user-1',
      );

      const json = event.toJSON();

      expect(json).toEqual({
        eventName: 'TemplateCreated',
        aggregateId: 'template-1',
        title: 'Test Title',
        description: 'Test Description',
        createdBy: 'user-1',
        occurredOn: expect.any(String),
      });
    });
  });

  describe('QuestionAddedEvent', () => {
    it('should have correct event name', () => {
      const event = new QuestionAddedEvent(
        'template-1',
        'question-1',
        'Question text',
        'text',
        1,
      );

      expect(event.eventName).toBe('QuestionAdded');
    });

    it('should have aggregateId and questionId', () => {
      const event = new QuestionAddedEvent(
        'template-1',
        'question-1',
        'Question text',
        'text',
        1,
      );

      expect(event.aggregateId).toBe('template-1');
      expect(event.questionId).toBe('question-1');
    });

    it('should have question text, type, order', () => {
      const event = new QuestionAddedEvent(
        'template-1',
        'question-1',
        'What is TypeScript?',
        'text',
        3,
      );

      expect(event.text).toBe('What is TypeScript?');
      expect(event.type).toBe('text');
      expect(event.order).toBe(3);
    });

    it('should have occurredOn timestamp', () => {
      const event = new QuestionAddedEvent(
        'template-1',
        'question-1',
        'Question text',
        'text',
        1,
      );

      expect(event.occurredOn).toBeInstanceOf(Date);
    });

    it('should serialize to JSON', () => {
      const event = new QuestionAddedEvent(
        'template-1',
        'question-1',
        'Question text',
        'video',
        2,
      );

      const json = event.toJSON();

      expect(json).toEqual({
        eventName: 'QuestionAdded',
        aggregateId: 'template-1',
        questionId: 'question-1',
        text: 'Question text',
        type: 'video',
        order: 2,
        occurredOn: expect.any(String),
      });
    });
  });

  describe('QuestionRemovedEvent', () => {
    it('should have correct event name', () => {
      const event = new QuestionRemovedEvent('template-1', 'question-1');

      expect(event.eventName).toBe('QuestionRemoved');
    });

    it('should have aggregateId and questionId', () => {
      const event = new QuestionRemovedEvent('template-1', 'question-1');

      expect(event.aggregateId).toBe('template-1');
      expect(event.questionId).toBe('question-1');
    });

    it('should have occurredOn timestamp', () => {
      const event = new QuestionRemovedEvent('template-1', 'question-1');

      expect(event.occurredOn).toBeInstanceOf(Date);
    });

    it('should serialize to JSON', () => {
      const event = new QuestionRemovedEvent('template-1', 'question-1');

      const json = event.toJSON();

      expect(json).toEqual({
        eventName: 'QuestionRemoved',
        aggregateId: 'template-1',
        questionId: 'question-1',
        occurredOn: expect.any(String),
      });
    });
  });

  describe('TemplatePublishedEvent', () => {
    it('should have correct event name', () => {
      const event = new TemplatePublishedEvent('template-1', 'Test Title', 5);

      expect(event.eventName).toBe('TemplatePublished');
    });

    it('should have aggregateId, title, questionCount', () => {
      const event = new TemplatePublishedEvent('template-1', 'Test Title', 5);

      expect(event.aggregateId).toBe('template-1');
      expect(event.title).toBe('Test Title');
      expect(event.questionCount).toBe(5);
    });

    it('should have occurredOn timestamp', () => {
      const event = new TemplatePublishedEvent('template-1', 'Test Title', 5);

      expect(event.occurredOn).toBeInstanceOf(Date);
    });

    it('should serialize to JSON', () => {
      const event = new TemplatePublishedEvent('template-1', 'Test Title', 5);

      const json = event.toJSON();

      expect(json).toEqual({
        eventName: 'TemplatePublished',
        aggregateId: 'template-1',
        title: 'Test Title',
        questionCount: 5,
        occurredOn: expect.any(String),
      });
    });
  });

  describe('TemplateArchivedEvent', () => {
    it('should have correct event name', () => {
      const event = new TemplateArchivedEvent('template-1', 'Test Title');

      expect(event.eventName).toBe('TemplateArchived');
    });

    it('should have aggregateId and title', () => {
      const event = new TemplateArchivedEvent('template-1', 'Test Title');

      expect(event.aggregateId).toBe('template-1');
      expect(event.title).toBe('Test Title');
    });

    it('should have occurredOn timestamp', () => {
      const event = new TemplateArchivedEvent('template-1', 'Test Title');

      expect(event.occurredOn).toBeInstanceOf(Date);
    });

    it('should serialize to JSON', () => {
      const event = new TemplateArchivedEvent('template-1', 'Test Title');

      const json = event.toJSON();

      expect(json).toEqual({
        eventName: 'TemplateArchived',
        aggregateId: 'template-1',
        title: 'Test Title',
        occurredOn: expect.any(String),
      });
    });
  });
});
