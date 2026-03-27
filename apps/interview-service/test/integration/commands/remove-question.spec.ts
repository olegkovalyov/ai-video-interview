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
import { RemoveQuestionCommand } from '../../../src/application/commands/remove-question/remove-question.command';
import { AddQuestionCommand } from '../../../src/application/commands/add-question/add-question.command';
import { QuestionEntity } from '../../../src/infrastructure/persistence/entities';
import {
  TemplateNotFoundException,
  TemplateUnauthorizedException,
} from '../../../src/domain/exceptions/interview-template.exceptions';
import { mockOutboxService } from '../test-application.module';

describe('RemoveQuestionCommand Integration', () => {
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
    jest.clearAllMocks();
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
    it('should remove question from template', async () => {
      // Arrange - seed template with questions
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: userId,
        questionsCount: 2,
      });

      // Get first question ID
      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId }, order: { order: 'ASC' } });

      const questionToRemove = questions[0];

      const command = new RemoveQuestionCommand(
        templateId,
        questionToRemove.id,
        userId,
        'hr',
      );

      // Act
      await commandBus.execute(command);

      // Assert - question should be deleted
      const remainingQuestions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      expect(remainingQuestions).toHaveLength(1);
      expect(remainingQuestions[0].id).toBe(questions[1].id);
    });

    it('should reorder remaining questions after removal', async () => {
      // Arrange - seed template with 3 questions
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: userId,
        questionsCount: 3,
      });

      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId }, order: { order: 'ASC' } });

      // Remove the middle question (order=2)
      const command = new RemoveQuestionCommand(
        templateId,
        questions[1].id,
        userId,
        'hr',
      );

      // Act
      await commandBus.execute(command);

      // Assert - remaining questions should be reordered 1, 2
      const remainingQuestions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId }, order: { order: 'ASC' } });

      expect(remainingQuestions).toHaveLength(2);
      expect(remainingQuestions[0].order).toBe(1);
      expect(remainingQuestions[1].order).toBe(2);
      expect(remainingQuestions[0].id).toBe(questions[0].id);
      expect(remainingQuestions[1].id).toBe(questions[2].id);
    });

    it('should remove last question leaving template empty', async () => {
      // Arrange - seed template with 1 question
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: userId,
        questionsCount: 1,
      });

      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      const command = new RemoveQuestionCommand(
        templateId,
        questions[0].id,
        userId,
        'hr',
      );

      // Act
      await commandBus.execute(command);

      // Assert - no questions remain
      const remainingQuestions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      expect(remainingQuestions).toHaveLength(0);
    });

    it('should save outbox event on remove', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: userId,
        questionsCount: 1,
      });

      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      const questionId = questions[0].id;
      const command = new RemoveQuestionCommand(
        templateId,
        questionId,
        userId,
        'hr',
      );

      // Act
      await commandBus.execute(command);

      // Assert - outbox service should have been called
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        'template.question.removed',
        { templateId, questionId },
        templateId,
        expect.anything(), // transaction
      );
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith([
        'mock-event-id',
      ]);
    });

    it('should allow admin to remove question from any template', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const adminUserId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'HR Template',
        description: 'Test',
        createdBy: hrUserId,
        questionsCount: 2,
      });

      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      const command = new RemoveQuestionCommand(
        templateId,
        questions[0].id,
        adminUserId,
        'admin',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const remainingQuestions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      expect(remainingQuestions).toHaveLength(1);
    });
  });

  describe('Error Cases', () => {
    it('should throw TemplateNotFoundException for non-existent template', async () => {
      // Arrange
      const nonExistentTemplateId = uuidv4();
      const command = new RemoveQuestionCommand(
        nonExistentTemplateId,
        uuidv4(),
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(
        TemplateNotFoundException,
      );
    });

    it('should throw error if question not found in template', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: userId,
        questionsCount: 1,
      });

      const nonExistentQuestionId = uuidv4();
      const command = new RemoveQuestionCommand(
        templateId,
        nonExistentQuestionId,
        userId,
        'hr',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error if template is archived', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Archived Interview',
        description: 'Test',
        createdBy: userId,
        status: 'archived',
        questionsCount: 1,
      });

      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      const command = new RemoveQuestionCommand(
        templateId,
        questions[0].id,
        userId,
        'hr',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(/archived/i);
    });

    it('should throw TemplateUnauthorizedException when HR removes question from another HR template', async () => {
      // Arrange
      const hr1UserId = uuidv4();
      const hr2UserId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'HR1 Template',
        description: 'Owned by HR1',
        createdBy: hr1UserId,
        questionsCount: 1,
      });

      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      const command = new RemoveQuestionCommand(
        templateId,
        questions[0].id,
        hr2UserId,
        'hr',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(
        TemplateUnauthorizedException,
      );

      // Verify question was NOT removed
      const remainingQuestions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId } });

      expect(remainingQuestions).toHaveLength(1);
    });
  });

  describe('Sequential Remove Operations', () => {
    it('should correctly reorder after removing multiple questions sequentially', async () => {
      // Arrange - create template and add 4 questions
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: userId,
        questionsCount: 4,
      });

      const allQuestions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId }, order: { order: 'ASC' } });

      // Act - remove question 2 and question 4 (by original ID)
      await commandBus.execute(
        new RemoveQuestionCommand(templateId, allQuestions[1].id, userId, 'hr'),
      );
      await commandBus.execute(
        new RemoveQuestionCommand(templateId, allQuestions[3].id, userId, 'hr'),
      );

      // Assert - should have 2 questions with orders 1, 2
      const remainingQuestions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId }, order: { order: 'ASC' } });

      expect(remainingQuestions).toHaveLength(2);
      expect(remainingQuestions[0].order).toBe(1);
      expect(remainingQuestions[1].order).toBe(2);
      expect(remainingQuestions[0].id).toBe(allQuestions[0].id);
      expect(remainingQuestions[1].id).toBe(allQuestions[2].id);
    });

    it('should allow adding question after removing one', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: userId,
        questionsCount: 2,
      });

      const questions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId }, order: { order: 'ASC' } });

      // Act - remove first question, then add a new one
      await commandBus.execute(
        new RemoveQuestionCommand(templateId, questions[0].id, userId, 'hr'),
      );

      const newQuestionId = await commandBus.execute(
        new AddQuestionCommand(
          templateId,
          'New question after removal',
          'video',
          2,
          60,
        ),
      );

      // Assert
      const finalQuestions = await dataSource
        .getRepository(QuestionEntity)
        .find({ where: { templateId }, order: { order: 'ASC' } });

      expect(finalQuestions).toHaveLength(2);
      expect(finalQuestions[1].id).toBe(newQuestionId);
    });
  });
});
