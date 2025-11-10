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
import { ReorderQuestionsCommand } from '../../../src/application/commands/reorder-questions/reorder-questions.command';
import { QuestionEntity } from '../../../src/infrastructure/persistence/entities';

describe('ReorderQuestionsCommand Integration', () => {
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
    it('should reorder 3 questions successfully', async () => {
      // Arrange - seed template with 3 questions
      const templateId = await seedTemplate(dataSource, {
        title: 'Test Template',
        description: 'Test',
        questionsCount: 3,
      });

      // Get original question order
      const originalQuestions = await dataSource
        .getRepository(QuestionEntity)
        .find({
          where: { templateId },
          order: { order: 'ASC' },
        });

      expect(originalQuestions).toHaveLength(3);
      const q1Id = originalQuestions[0].id;
      const q2Id = originalQuestions[1].id;
      const q3Id = originalQuestions[2].id;

      // Act - Reorder: q3, q1, q2
      await commandBus.execute(
        new ReorderQuestionsCommand(templateId, [q3Id, q1Id, q2Id]),
      );

      // Assert - Check new order
      const reorderedQuestions = await dataSource
        .getRepository(QuestionEntity)
        .find({
          where: { templateId },
          order: { order: 'ASC' },
        });

      expect(reorderedQuestions[0].id).toBe(q3Id);
      expect(reorderedQuestions[0].order).toBe(1);
      expect(reorderedQuestions[1].id).toBe(q1Id);
      expect(reorderedQuestions[1].order).toBe(2);
      expect(reorderedQuestions[2].id).toBe(q2Id);
      expect(reorderedQuestions[2].order).toBe(3);
    });

    it('should reorder 10 questions successfully', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Large Template',
        description: 'Test',
        questionsCount: 10,
      });

      const originalQuestions = await dataSource
        .getRepository(QuestionEntity)
        .find({
          where: { templateId },
          order: { order: 'ASC' },
        });

      const originalIds = originalQuestions.map((q) => q.id);

      // Act - Reverse order
      const reversedIds = [...originalIds].reverse();
      await commandBus.execute(
        new ReorderQuestionsCommand(templateId, reversedIds),
      );

      // Assert
      const reorderedQuestions = await dataSource
        .getRepository(QuestionEntity)
        .find({
          where: { templateId },
          order: { order: 'ASC' },
        });

      expect(reorderedQuestions[0].id).toBe(originalIds[9]);
      expect(reorderedQuestions[9].id).toBe(originalIds[0]);
    });

    it('should execute quickly with batch UPDATE (performance)', async () => {
      // Arrange - 20 questions
      const templateId = await seedTemplate(dataSource, {
        title: 'Performance Test',
        description: 'Test',
        questionsCount: 20,
      });

      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({
          where: { templateId },
          order: { order: 'ASC' },
        });

      const reversedIds = questions.map((q) => q.id).reverse();

      // Act - Measure time
      const startTime = Date.now();
      await commandBus.execute(
        new ReorderQuestionsCommand(templateId, reversedIds),
      );
      const duration = Date.now() - startTime;

      // Assert - Should be fast (single SQL query)
      expect(duration).toBeLessThan(100); // < 100ms for 20 questions

      // Verify order changed
      const reordered = await dataSource
        .getRepository(QuestionEntity)
        .find({
          where: { templateId },
          order: { order: 'ASC' },
        });

      expect(reordered[0].id).toBe(questions[19].id);
    });

    it('should work with single question', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Single Question',
        description: 'Test',
        questionsCount: 1,
      });

      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      const questionId = questions[0].id;

      // Act
      await commandBus.execute(
        new ReorderQuestionsCommand(templateId, [questionId]),
      );

      // Assert - Order should remain 1
      const result = await dataSource
        .getRepository(QuestionEntity)
        .findOne({ where: { id: questionId } });

      expect(result!.order).toBe(1);
    });

    it('should preserve question content (only order changes)', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Content Test',
        description: 'Test',
        questionsCount: 3,
      });

      const original = await dataSource
        .getRepository(QuestionEntity)
        .find({
          where: { templateId },
          order: { order: 'ASC' },
        });

      const originalTexts = original.map((q) => q.text);
      const ids = original.map((q) => q.id);

      // Act - Reverse
      await commandBus.execute(
        new ReorderQuestionsCommand(templateId, ids.reverse()),
      );

      // Assert - Content unchanged, order changed
      const reordered = await dataSource
        .getRepository(QuestionEntity)
        .find({
          where: { templateId },
          order: { order: 'ASC' },
        });

      // Text content preserved
      expect(reordered[0].text).toBe(originalTexts[2]);
      expect(reordered[1].text).toBe(originalTexts[1]);
      expect(reordered[2].text).toBe(originalTexts[0]);

      // IDs unchanged
      expect(reordered[0].id).toBe(ids[0]); // Was last, now first
      expect(reordered[2].id).toBe(ids[2]); // Was first, now last
    });
  });

  describe('Error Cases', () => {
    it('should throw error if template not found', async () => {
      const nonExistentId = uuidv4();
      const fakeQuestionIds = [uuidv4(), uuidv4()];
      
      await expect(
        commandBus.execute(
          new ReorderQuestionsCommand(nonExistentId, fakeQuestionIds),
        ),
      ).rejects.toThrow(/not found/i);
    });

    it('should throw error if template is archived', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Test',
        description: 'Test',
        questionsCount: 2,
        status: 'archived',
      });

      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      const ids = questions.map((q) => q.id);

      // Act & Assert
      await expect(
        commandBus.execute(new ReorderQuestionsCommand(templateId, ids)),
      ).rejects.toThrow(/archived/i);
    });

    it('should throw error if question ID does not exist', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Test',
        description: 'Test',
        questionsCount: 2,
      });

      // Act & Assert
      await expect(
        commandBus.execute(
          new ReorderQuestionsCommand(templateId, [
            'valid-id',
            'invalid-id',
          ]),
        ),
      ).rejects.toThrow(/do not exist/i);
    });

    it('should throw error if not all questions provided', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Test',
        description: 'Test',
        questionsCount: 3,
      });

      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      const twoIds = [questions[0].id, questions[1].id]; // Missing 3rd

      // Act & Assert
      await expect(
        commandBus.execute(new ReorderQuestionsCommand(templateId, twoIds)),
      ).rejects.toThrow(/Must provide all question IDs/i);
    });

    it('should throw error if duplicate IDs provided', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Test',
        description: 'Test',
        questionsCount: 2,
      });

      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      const duplicateIds = [questions[0].id, questions[0].id]; // Duplicate

      // Act & Assert
      await expect(
        commandBus.execute(
          new ReorderQuestionsCommand(templateId, duplicateIds),
        ),
      ).rejects.toThrow(/Duplicate/i);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty template gracefully', async () => {
      // Arrange - Template with 0 questions
      const templateId = await seedTemplate(dataSource, {
        title: 'Empty Template',
        description: 'Test',
        questionsCount: 0,
      });

      // Act & Assert - Empty array should fail validation
      await expect(
        commandBus.execute(new ReorderQuestionsCommand(templateId, [])),
      ).rejects.toThrow();
    });
  });
});
