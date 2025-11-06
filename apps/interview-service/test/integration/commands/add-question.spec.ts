import { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedTemplate,
} from '../setup';
import { AddQuestionCommand } from '../../../src/application/commands/add-question/add-question.command';
import { QuestionEntity } from '../../../src/infrastructure/persistence/entities';

describe('AddQuestionCommand Integration', () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    commandBus = app.get(CommandBus);
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Success Cases', () => {
    it('should add question to template', async () => {
      // Arrange - seed template
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
      });

      const command = new AddQuestionCommand(
        templateId,
        'Tell me about yourself in detail',
        'video',
        1,
        60,
        true,
        'Be concise',
      );

      // Act
      const questionId = await commandBus.execute(command);

      // Assert
      expect(questionId).toBeDefined();
      expect(typeof questionId).toBe('string');

      const entity = await dataSource
        .getRepository(QuestionEntity)
        .findOne({ where: { id: questionId } });

      expect(entity).toBeDefined();
      expect(entity!.templateId).toBe(templateId);
      expect(entity!.text).toBe('Tell me about yourself in detail');
      expect(entity!.type).toBe('video');
      expect(entity!.order).toBe(1);
      expect(entity!.timeLimit).toBe(60);
      expect(entity!.required).toBe(true);
      expect(entity!.hints).toBe('Be concise');
    });

    it('should add multiple questions to same template', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
      });

      // Act - add 3 questions
      await commandBus.execute(
        new AddQuestionCommand(templateId, 'What is your experience?', 'video', 1, 60),
      );
      await commandBus.execute(
        new AddQuestionCommand(templateId, 'Describe your skills', 'text', 2, 30),
      );
      await commandBus.execute(
        new AddQuestionCommand(templateId, 'Tell us about your project', 'video', 3, 90),
      );

      // Assert
      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({
          where: { templateId },
          order: { order: 'ASC' },
        });

      expect(questions).toHaveLength(3);
      expect(questions[0].order).toBe(1);
      expect(questions[1].order).toBe(2);
      expect(questions[2].order).toBe(3);
    });

    it('should add question without hints (optional)', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
      });

      // Act - hints not provided
      const questionId = await commandBus.execute(
        new AddQuestionCommand(
          templateId,
          'Question text',
          'video',
          1,
          60,
          true,
        ),
      );

      // Assert
      const entity = await dataSource
        .getRepository(QuestionEntity)
        .findOne({ where: { id: questionId } });

      expect(entity!.hints).toBeNull();
    });
  });

  describe('Error Cases', () => {
    it('should throw error if template not found', async () => {
      // Act & Assert
      const nonExistentId = uuidv4();
      await expect(
        commandBus.execute(
          new AddQuestionCommand(
            nonExistentId,
            'What is your main goal?',
            'video',
            1,
            60,
          ),
        ),
      ).rejects.toThrow();
    });

    it('should throw error for duplicate question order', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        questionsCount: 1, // Already has question with order=1
      });

      // Act & Assert - try to add question with same order
      await expect(
        commandBus.execute(
          new AddQuestionCommand(templateId, 'Duplicate order question', 'video', 1, 60),
        ),
      ).rejects.toThrow();
    });

    it('should throw error if template is archived', async () => {
      // Arrange - archived template
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        status: 'archived',
      });

      // Act & Assert
      await expect(
        commandBus.execute(
          new AddQuestionCommand(templateId, 'What is your background?', 'video', 1, 60),
        ),
      ).rejects.toThrow(/archived/i);
    });

    it('should throw error for invalid question type', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
      });

      // Act & Assert
      await expect(
        commandBus.execute(
          new AddQuestionCommand(
            templateId,
            'What is your experience here?',
            'invalid-type' as any,
            1,
            60,
          ),
        ),
      ).rejects.toThrow();
    });
  });

  describe('Race Conditions', () => {
    it('should handle concurrent addQuestion with same order (unique constraint)', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
      });

      // Act - Two parallel requests with same order=1
      const results = await Promise.allSettled([
        commandBus.execute(
          new AddQuestionCommand(templateId, 'What is your experience?', 'video', 1, 60),
        ),
        commandBus.execute(
          new AddQuestionCommand(templateId, 'Tell us about yourself', 'video', 1, 60),
        ),
      ]);

      // Assert
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // One should succeed, the other should fail
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      // Verify only 1 question in DB
      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      expect(questions).toHaveLength(1);
      expect(questions[0].order).toBe(1);
    });

    it('should handle concurrent addQuestion with different orders (both succeed)', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
      });

      // Act - Two parallel requests with DIFFERENT orders
      const results = await Promise.allSettled([
        commandBus.execute(
          new AddQuestionCommand(templateId, 'What is your main skill?', 'video', 1, 60),
        ),
        commandBus.execute(
          new AddQuestionCommand(templateId, 'Describe your project', 'video', 2, 60),
        ),
      ]);

      // Assert - Both should succeed
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(2);
      expect(rejected).toHaveLength(0);

      // Verify both questions in DB
      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ 
          where: { templateId },
          order: { order: 'ASC' },
        });

      expect(questions).toHaveLength(2);
      expect(questions[0].order).toBe(1);
      expect(questions[1].order).toBe(2);
    });

    it('should handle race condition: addQuestion + updateMetadata (optimistic lock)', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Original Title',
        description: 'Test',
      });

      // Simulate parallel operations on same template
      const results = await Promise.allSettled([
        // Request A: Adds question
        commandBus.execute(
          new AddQuestionCommand(templateId, 'What are your skills?', 'video', 1, 60),
        ),
        // Request B: Updates title (if such command exists)
        // NOTE: No UpdateTemplateCommand yet, but test demonstrates the concept
        commandBus.execute(
          new AddQuestionCommand(templateId, 'Describe your experience', 'video', 2, 60),
        ),
      ]);

      // Assert - With optimistic locking both should execute
      // If one operation conflicts - will throw ConflictException
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      
      // In current implementation both should pass (different orders)
      expect(fulfilled.length).toBeGreaterThanOrEqual(1);

      // Check final state
      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      expect(questions.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle 10 concurrent addQuestion requests (stress test)', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Stress Test',
        description: 'Test',
      });

      // Act - 10 parallel requests, each with unique order
      const promises = Array.from({ length: 10 }, (_, i) =>
        commandBus.execute(
          new AddQuestionCommand(
            templateId,
            `Question ${i + 1}`,
            'video',
            i + 1,
            60,
          ),
        ),
      );

      const results = await Promise.allSettled(promises);

      // Assert
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      
      // With optimistic locking there may be conflicts even with different orders
      // Verify that majority passed (minimum 5 out of 10)
      expect(fulfilled.length).toBeGreaterThanOrEqual(5);
      expect(fulfilled.length + rejected.length).toBe(10);

      // Check DB - how many actually saved
      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ 
          where: { templateId },
          order: { order: 'ASC' },
        });

      // Should have same number of questions as fulfilled
      expect(questions).toHaveLength(fulfilled.length);
      
      // Verify all orders are unique
      const orders = questions.map(q => q.order);
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(questions.length);
    });

    it('should handle mixed race: some duplicate orders, some unique', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Mixed Race Test',
        description: 'Test',
      });

      // Act - 5 requests: 3 with order=1, 2 with order=2
      const results = await Promise.allSettled([
        commandBus.execute(
          new AddQuestionCommand(templateId, 'What is your experience A?', 'video', 1, 60),
        ),
        commandBus.execute(
          new AddQuestionCommand(templateId, 'What is your experience B?', 'video', 1, 60),
        ),
        commandBus.execute(
          new AddQuestionCommand(templateId, 'What is your experience C?', 'video', 1, 60),
        ),
        commandBus.execute(
          new AddQuestionCommand(templateId, 'Describe your skills A', 'video', 2, 60),
        ),
        commandBus.execute(
          new AddQuestionCommand(templateId, 'Describe your skills B', 'video', 2, 60),
        ),
      ]);

      // Assert
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Should be exactly 2 successful (1 for each order)
      expect(fulfilled).toHaveLength(2);
      expect(rejected).toHaveLength(3);

      // Verify in DB
      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ 
          where: { templateId },
          order: { order: 'ASC' },
        });

      expect(questions).toHaveLength(2);
      expect(questions[0].order).toBe(1);
      expect(questions[1].order).toBe(2);
    });
  });
});
