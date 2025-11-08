import { InterviewTemplate } from '../interview-template.aggregate';
import { Question } from '../../entities/question.entity';
import { InterviewSettings } from '../../value-objects/interview-settings.vo';
import { TemplateStatus } from '../../value-objects/template-status.vo';
import { QuestionType } from '../../value-objects/question-type.vo';
import {
  TemplateCreatedEvent,
  QuestionAddedEvent,
  QuestionRemovedEvent,
  QuestionsReorderedEvent,
  TemplatePublishedEvent,
  TemplateArchivedEvent,
} from '../../events';

describe('InterviewTemplate Aggregate', () => {
  const createValidQuestion = (id: string, order: number) => {
    return Question.create(id, {
      text: `Question ${order}: What is your experience?`,
      type: QuestionType.text(),
      order,
      timeLimit: 300,
      required: true,
    });
  };

  describe('Creation', () => {
    it('should create template with default settings', () => {
      const template = InterviewTemplate.create(
        'template-1',
        'Technical Interview',
        'Questions for Senior Developer',
        'hr-user-1',
      );

      expect(template.id).toBe('template-1');
      expect(template.title).toBe('Technical Interview');
      expect(template.description).toBe('Questions for Senior Developer');
      expect(template.createdBy).toBe('hr-user-1');
      expect(template.status.isDraft()).toBe(true);
      expect(template.questions).toEqual([]);
      expect(template.settings).toBeDefined();
      expect(template.createdAt).toBeInstanceOf(Date);
      expect(template.updatedAt).toBeInstanceOf(Date);
    });

    it('should create template with custom settings', () => {
      const customSettings = InterviewSettings.create({
        totalTimeLimit: 90,
        allowRetakes: true,
        showTimer: false,
        randomizeQuestions: true,
      });

      const template = InterviewTemplate.create(
        'template-1',
        'Title',
        'Description',
        'hr-user-1',
        customSettings,
      );

      expect(template.settings.equals(customSettings)).toBe(true);
    });

    it('should set initial status to DRAFT', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Description',
        'user-1',
      );

      expect(template.status.isDraft()).toBe(true);
    });

    it('should initialize with empty questions array', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Description',
        'user-1',
      );

      expect(template.questions).toEqual([]);
      expect(template.getQuestionsCount()).toBe(0);
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const before = new Date();
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Description',
        'user-1',
      );
      const after = new Date();

      expect(template.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(template.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(template.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });

    it('should emit TemplateCreatedEvent', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Description',
        'user-1',
      );

      const events = template.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TemplateCreatedEvent);
      expect(events[0].aggregateId).toBe('id');
    });
  });

  describe('Reconstitute', () => {
    it('should reconstitute template from persistence', () => {
      const existingDate = new Date('2024-01-01');
      const question = createValidQuestion('q1', 1);

      const template = InterviewTemplate.reconstitute({
        id: 'template-1',
        title: 'Existing Template',
        description: 'Existing Description',
        createdBy: 'user-1',
        status: TemplateStatus.active(),
        questions: [question],
        settings: InterviewSettings.default(),
        createdAt: existingDate,
        updatedAt: existingDate,
      });

      expect(template.id).toBe('template-1');
      expect(template.status.isActive()).toBe(true);
      expect(template.questions).toHaveLength(1);
      expect(template.createdAt).toBe(existingDate);
    });

    it('should NOT emit events on reconstitute', () => {
      const template = InterviewTemplate.reconstitute({
        id: 'template-1',
        title: 'Title',
        description: 'Desc',
        createdBy: 'user-1',
        status: TemplateStatus.draft(),
        questions: [],
        settings: InterviewSettings.default(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const events = template.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('Getters', () => {
    const template = InterviewTemplate.create(
      'test-id',
      'Test Title',
      'Test Description',
      'user-123',
    );

    it('should return correct id', () => {
      expect(template.id).toBe('test-id');
    });

    it('should return correct title', () => {
      expect(template.title).toBe('Test Title');
    });

    it('should return correct description', () => {
      expect(template.description).toBe('Test Description');
    });

    it('should return correct createdBy', () => {
      expect(template.createdBy).toBe('user-123');
    });

    it('should return correct status', () => {
      expect(template.status.isDraft()).toBe(true);
    });

    it('should return copy of questions array', () => {
      const questions = template.questions;
      questions.push(createValidQuestion('q1', 1));

      expect(template.questions).toHaveLength(0);
    });

    it('should return correct settings', () => {
      expect(template.settings).toBeInstanceOf(InterviewSettings);
    });

    it('should return correct createdAt', () => {
      expect(template.createdAt).toBeInstanceOf(Date);
    });

    it('should return correct updatedAt', () => {
      expect(template.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('addQuestion - Happy Path', () => {
    it('should add question to draft template', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      const question = createValidQuestion('q1', 1);

      template.addQuestion(question);

      expect(template.questions).toHaveLength(1);
      expect(template.questions[0].id).toBe('q1');
    });

    it('should add multiple questions', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );

      template.addQuestion(createValidQuestion('q1', 1));
      template.addQuestion(createValidQuestion('q2', 2));
      template.addQuestion(createValidQuestion('q3', 3));

      expect(template.questions).toHaveLength(3);
    });

    it('should update updatedAt timestamp', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      const originalUpdatedAt = template.updatedAt;

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        template.addQuestion(createValidQuestion('q1', 1));
        expect(template.updatedAt.getTime()).toBeGreaterThanOrEqual(
          originalUpdatedAt.getTime(),
        );
      }, 10);
    });

    it('should emit QuestionAddedEvent', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.commit(); // Clear creation event

      const question = createValidQuestion('q1', 1);
      template.addQuestion(question);

      const events = template.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(QuestionAddedEvent);
      expect((events[0] as QuestionAddedEvent).questionId).toBe('q1');
    });
  });

  describe('addQuestion - Business Rules', () => {
    it('should throw error when adding to archived template', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      template.publish();
      template.archive();

      expect(() => {
        template.addQuestion(createValidQuestion('q2', 2));
      }).toThrow('Cannot add questions to archived template');
    });

    it('should throw error when question order already exists', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));

      expect(() => {
        template.addQuestion(createValidQuestion('q2', 1)); // Same order
      }).toThrow('Question with order 1 already exists');
    });

    it('should allow different orders', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );

      template.addQuestion(createValidQuestion('q1', 1));
      template.addQuestion(createValidQuestion('q2', 2));

      expect(template.questions).toHaveLength(2);
    });
  });

  describe('removeQuestion - Happy Path', () => {
    it('should remove question from template', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      const question = createValidQuestion('q1', 1);
      template.addQuestion(question);

      template.removeQuestion('q1');

      expect(template.questions).toHaveLength(0);
    });

    it('should reorder remaining questions after removal', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      template.addQuestion(createValidQuestion('q2', 2));
      template.addQuestion(createValidQuestion('q3', 3));

      template.removeQuestion('q2'); // Remove middle question

      expect(template.questions).toHaveLength(2);
      expect(template.questions[0].order).toBe(1);
      expect(template.questions[1].order).toBe(2); // Reordered from 3 to 2
    });

    it('should update updatedAt', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      const beforeRemove = template.updatedAt;

      setTimeout(() => {
        template.removeQuestion('q1');
        expect(template.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeRemove.getTime(),
        );
      }, 10);
    });

    it('should emit QuestionRemovedEvent', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      template.commit();

      template.removeQuestion('q1');

      const events = template.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(QuestionRemovedEvent);
    });
  });

  describe('removeQuestion - Validation', () => {
    it('should throw error when removing from archived template', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      template.publish();
      template.archive();

      expect(() => {
        template.removeQuestion('q1');
      }).toThrow('Cannot remove questions from archived template');
    });

    it('should throw error when question not found', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );

      expect(() => {
        template.removeQuestion('non-existent');
      }).toThrow('Question with id non-existent not found');
    });
  });

  describe('publish - Happy Path', () => {
    it('should publish draft template with questions', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));

      template.publish();

      expect(template.status.isActive()).toBe(true);
    });

    it('should update updatedAt', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      const beforePublish = template.updatedAt;

      setTimeout(() => {
        template.publish();
        expect(template.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforePublish.getTime(),
        );
      }, 10);
    });

    it('should emit TemplatePublishedEvent', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      template.commit();

      template.publish();

      const events = template.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TemplatePublishedEvent);
      expect((events[0] as TemplatePublishedEvent).questionCount).toBe(1);
    });
  });

  describe('publish - Business Rules', () => {
    it('should throw error when publishing active template', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      template.publish();

      expect(() => {
        template.publish();
      }).toThrow('Only draft templates can be published');
    });

    it('should throw error when publishing archived template', () => {
      const template = InterviewTemplate.reconstitute({
        id: 'id',
        title: 'Title',
        description: 'Desc',
        createdBy: 'user-1',
        status: TemplateStatus.archived(),
        questions: [createValidQuestion('q1', 1)],
        settings: InterviewSettings.default(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(() => {
        template.publish();
      }).toThrow('Only draft templates can be published');
    });

    it('should throw error when publishing without questions', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );

      expect(() => {
        template.publish();
      }).toThrow('Cannot publish template without questions');
    });

    it('should publish with exactly 1 question (boundary)', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));

      template.publish();

      expect(template.status.isActive()).toBe(true);
    });
  });

  describe('archive - Happy Path', () => {
    it('should archive draft template', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );

      template.archive();

      expect(template.status.isArchived()).toBe(true);
    });

    it('should archive active template', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      template.publish();

      template.archive();

      expect(template.status.isArchived()).toBe(true);
    });

    it('should update updatedAt', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      const beforeArchive = template.updatedAt;

      setTimeout(() => {
        template.archive();
        expect(template.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeArchive.getTime(),
        );
      }, 10);
    });

    it('should emit TemplateArchivedEvent', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.commit();

      template.archive();

      const events = template.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TemplateArchivedEvent);
    });
  });

  describe('archive - Validation', () => {
    it('should throw error when archiving already archived template', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.archive();

      expect(() => {
        template.archive();
      }).toThrow('Template is already archived');
    });
  });

  describe('updateMetadata - Happy Path', () => {
    it('should update title', () => {
      const template = InterviewTemplate.create(
        'id',
        'Old Title',
        'Desc',
        'user-1',
      );

      template.updateMetadata('New Title');

      expect(template.title).toBe('New Title');
      expect(template.description).toBe('Desc');
    });

    it('should update description', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Old Description',
        'user-1',
      );

      template.updateMetadata(undefined, 'New Description');

      expect(template.title).toBe('Title');
      expect(template.description).toBe('New Description');
    });

    it('should update both title and description', () => {
      const template = InterviewTemplate.create(
        'id',
        'Old Title',
        'Old Desc',
        'user-1',
      );

      template.updateMetadata('New Title', 'New Description');

      expect(template.title).toBe('New Title');
      expect(template.description).toBe('New Description');
    });

    it('should update updatedAt', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      const beforeUpdate = template.updatedAt;

      setTimeout(() => {
        template.updateMetadata('New Title');
        expect(template.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeUpdate.getTime(),
        );
      }, 10);
    });

    it('should keep other fields unchanged', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      const status = template.status;
      const questionsCount = template.getQuestionsCount();

      template.updateMetadata('New Title');

      expect(template.status).toBe(status);
      expect(template.getQuestionsCount()).toBe(questionsCount);
    });
  });

  describe('updateMetadata - Validation', () => {
    it('should throw error when updating archived template', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.archive();

      expect(() => {
        template.updateMetadata('New Title');
      }).toThrow('Cannot modify archived template');
    });

    it('should throw error for empty title', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );

      expect(() => {
        template.updateMetadata('');
      }).toThrow('Title cannot be empty');
    });

    it('should throw error for whitespace-only title', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );

      expect(() => {
        template.updateMetadata('   ');
      }).toThrow('Title cannot be empty');
    });

    it('should throw error for title > 200 characters', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      const longTitle = 'a'.repeat(201);

      expect(() => {
        template.updateMetadata(longTitle);
      }).toThrow('Title cannot exceed 200 characters');
    });

    it('should accept title at boundary (200 chars)', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      const maxTitle = 'a'.repeat(200);

      template.updateMetadata(maxTitle);

      expect(template.title).toBe(maxTitle);
    });

    it('should throw error for description > 1000 characters', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      const longDesc = 'a'.repeat(1001);

      expect(() => {
        template.updateMetadata(undefined, longDesc);
      }).toThrow('Description cannot exceed 1000 characters');
    });

    it('should accept description at boundary (1000 chars)', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      const maxDesc = 'a'.repeat(1000);

      template.updateMetadata(undefined, maxDesc);

      expect(template.description).toBe(maxDesc);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      const newSettings = InterviewSettings.create({
        totalTimeLimit: 120,
        allowRetakes: true,
        showTimer: false,
        randomizeQuestions: true,
      });

      template.updateSettings(newSettings);

      expect(template.settings.equals(newSettings)).toBe(true);
    });

    it('should update updatedAt', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      const beforeUpdate = template.updatedAt;

      setTimeout(() => {
        template.updateSettings(InterviewSettings.default());
        expect(template.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeUpdate.getTime(),
        );
      }, 10);
    });

    it('should throw error when updating archived template', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.archive();

      expect(() => {
        template.updateSettings(InterviewSettings.default());
      }).toThrow('Cannot modify archived template');
    });
  });

  describe('Utility Methods', () => {
    it('getQuestion should return question by ID', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      const question = createValidQuestion('q1', 1);
      template.addQuestion(question);

      const found = template.getQuestion('q1');

      expect(found).toBeDefined();
      expect(found?.id).toBe('q1');
    });

    it('getQuestion should return undefined when not found', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );

      const found = template.getQuestion('non-existent');

      expect(found).toBeUndefined();
    });

    it('getQuestionsCount should return correct count', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      template.addQuestion(createValidQuestion('q2', 2));
      template.addQuestion(createValidQuestion('q3', 3));

      expect(template.getQuestionsCount()).toBe(3);
    });

    it('hasQuestions should return true when has questions', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));

      expect(template.hasQuestions()).toBe(true);
    });

    it('hasQuestions should return false when empty', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );

      expect(template.hasQuestions()).toBe(false);
    });

    it('getSortedQuestions should return questions sorted by order', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      // Add in random order
      template.addQuestion(createValidQuestion('q3', 3));
      template.addQuestion(createValidQuestion('q1', 1));
      template.addQuestion(createValidQuestion('q2', 2));

      const sorted = template.getSortedQuestions();

      expect(sorted[0].order).toBe(1);
      expect(sorted[1].order).toBe(2);
      expect(sorted[2].order).toBe(3);
    });

    it('isOwnedBy should return true for owner', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );

      expect(template.isOwnedBy('user-1')).toBe(true);
    });

    it('isOwnedBy should return false for different user', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );

      expect(template.isOwnedBy('user-2')).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const template = InterviewTemplate.create(
        'test-id',
        'Test Title',
        'Test Description',
        'user-123',
      );
      template.addQuestion(createValidQuestion('q1', 1));

      const json = template.toJSON();

      expect(json).toEqual({
        id: 'test-id',
        title: 'Test Title',
        description: 'Test Description',
        createdBy: 'user-123',
        status: 'draft',
        questions: expect.any(Array),
        settings: expect.any(Object),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(json.questions).toHaveLength(1);
    });
  });

  describe('Domain Events', () => {
    it('should accumulate multiple events', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      template.publish();

      const events = template.getUncommittedEvents();

      expect(events).toHaveLength(3); // Created + QuestionAdded + Published
      expect(events[0]).toBeInstanceOf(TemplateCreatedEvent);
      expect(events[1]).toBeInstanceOf(QuestionAddedEvent);
      expect(events[2]).toBeInstanceOf(TemplatePublishedEvent);
    });

    it('should clear events after commit', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));

      expect(template.getUncommittedEvents()).toHaveLength(2);

      template.commit();

      expect(template.getUncommittedEvents()).toHaveLength(0);
    });

    it('should not emit events on reconstitute', () => {
      const template = InterviewTemplate.reconstitute({
        id: 'id',
        title: 'Title',
        description: 'Desc',
        createdBy: 'user-1',
        status: TemplateStatus.active(),
        questions: [createValidQuestion('q1', 1)],
        settings: InterviewSettings.default(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(template.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('Reorder Questions', () => {
    it('should reorder questions successfully', () => {
      const template = InterviewTemplate.create(
        'template-1',
        'Test Template',
        'Description',
        'hr-user-1',
      );

      const q1 = createValidQuestion('q1', 1);
      const q2 = createValidQuestion('q2', 2);
      const q3 = createValidQuestion('q3', 3);

      template.addQuestion(q1);
      template.addQuestion(q2);
      template.addQuestion(q3);

      // Reorder: q3, q1, q2
      template.reorderQuestionsByIds(['q3', 'q1', 'q2']);

      const sorted = template.getSortedQuestions();
      expect(sorted[0].id).toBe('q3');
      expect(sorted[0].order).toBe(1);
      expect(sorted[1].id).toBe('q1');
      expect(sorted[1].order).toBe(2);
      expect(sorted[2].id).toBe('q2');
      expect(sorted[2].order).toBe(3);
    });

    it('should emit QuestionsReorderedEvent', () => {
      const template = InterviewTemplate.create(
        'template-1',
        'Test',
        'Desc',
        'user-1',
      );

      template.addQuestion(createValidQuestion('q1', 1));
      template.addQuestion(createValidQuestion('q2', 2));
      template.commit(); // Clear previous events

      template.reorderQuestionsByIds(['q2', 'q1']);

      const events = template.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(QuestionsReorderedEvent);
      expect((events[0] as QuestionsReorderedEvent).questionIds).toEqual([
        'q2',
        'q1',
      ]);
    });

    it('should throw error if template is archived', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      template.addQuestion(createValidQuestion('q2', 2));
      template.publish();
      template.archive();

      expect(() => {
        template.reorderQuestionsByIds(['q2', 'q1']);
      }).toThrow('Cannot reorder questions in archived template');
    });

    it('should throw error if question ID does not exist', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      template.addQuestion(createValidQuestion('q2', 2));

      expect(() => {
        template.reorderQuestionsByIds(['q1', 'q-invalid']);
      }).toThrow('One or more question IDs do not exist');
    });

    it('should throw error if not all question IDs provided', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      template.addQuestion(createValidQuestion('q2', 2));
      template.addQuestion(createValidQuestion('q3', 3));

      expect(() => {
        template.reorderQuestionsByIds(['q1', 'q2']); // Missing q3
      }).toThrow('Must provide all question IDs. Expected 3, got 2');
    });

    it('should throw error if too many IDs provided', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      template.addQuestion(createValidQuestion('q2', 2));

      expect(() => {
        template.reorderQuestionsByIds(['q1', 'q2', 'q3']); // Extra q3
      }).toThrow('One or more question IDs do not exist');
    });

    it('should throw error if duplicate IDs provided', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));
      template.addQuestion(createValidQuestion('q2', 2));

      expect(() => {
        template.reorderQuestionsByIds(['q1', 'q1']); // Duplicate
      }).toThrow('Duplicate question IDs are not allowed');
    });

    it('should work with single question', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );
      template.addQuestion(createValidQuestion('q1', 1));

      template.reorderQuestionsByIds(['q1']);

      const sorted = template.getSortedQuestions();
      expect(sorted).toHaveLength(1);
      expect(sorted[0].order).toBe(1);
    });

    it('should reorder 10 questions correctly', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );

      const questions = Array.from({ length: 10 }, (_, i) =>
        createValidQuestion(`q${i + 1}`, i + 1),
      );
      questions.forEach((q) => template.addQuestion(q));

      // Reverse order
      const reversedIds = questions.map((q) => q.id).reverse();
      template.reorderQuestionsByIds(reversedIds);

      const sorted = template.getSortedQuestions();
      expect(sorted[0].id).toBe('q10');
      expect(sorted[9].id).toBe('q1');
    });

    it('should maintain immutability (create new Question instances)', () => {
      const template = InterviewTemplate.create(
        'id',
        'Title',
        'Desc',
        'user-1',
      );

      const q1 = createValidQuestion('q1', 1);
      const q2 = createValidQuestion('q2', 2);

      template.addQuestion(q1);
      template.addQuestion(q2);

      const originalQ1 = template.getQuestion('q1')!;
      const originalOrder1 = originalQ1.order;

      template.reorderQuestionsByIds(['q2', 'q1']);

      const reorderedQ1 = template.getQuestion('q1')!;

      // New instance created (immutability)
      expect(reorderedQ1).not.toBe(originalQ1);
      expect(reorderedQ1.order).toBe(2);
      expect(originalOrder1).toBe(1); // Original unchanged
    });
  });
});
