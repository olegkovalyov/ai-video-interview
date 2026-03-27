import { INestApplication } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedTemplate,
} from '../setup';
import { GetTemplateQuestionsQuery } from '../../../src/application/queries/get-template-questions/get-template-questions.query';
import { TemplateNotFoundException } from '../../../src/domain/exceptions/interview-template.exceptions';
import { QuestionEntity } from '../../../src/infrastructure/persistence/entities';
import { QuestionResponseDto } from '../../../src/application/dto/question.response.dto';

describe('GetTemplateQuestionsQuery Integration', () => {
  let app: INestApplication;
  let queryBus: QueryBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    queryBus = app.get(QueryBus);
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
    it('should return questions for template', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        questionsCount: 3,
      });

      // Act
      const query = new GetTemplateQuestionsQuery(templateId);
      const result: QuestionResponseDto[] = await queryBus.execute(query);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('text');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('order');
      expect(result[0]).toHaveProperty('timeLimit');
      expect(result[0]).toHaveProperty('required');
    });

    it('should return questions sorted by order', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        questionsCount: 5,
      });

      // Act
      const query = new GetTemplateQuestionsQuery(templateId);
      const result: QuestionResponseDto[] = await queryBus.execute(query);

      // Assert - questions should be ordered
      expect(result).toHaveLength(5);
      for (let i = 0; i < result.length; i++) {
        expect(result[i].order).toBe(i + 1);
      }
    });

    it('should return empty array for template without questions', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Empty Template',
        description: 'No questions',
        questionsCount: 0,
      });

      // Act
      const query = new GetTemplateQuestionsQuery(templateId);
      const result: QuestionResponseDto[] = await queryBus.execute(query);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return correct question fields', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        questionsCount: 1,
      });

      // Act
      const query = new GetTemplateQuestionsQuery(templateId);
      const result: QuestionResponseDto[] = await queryBus.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      const question = result[0];
      expect(question.id).toBeDefined();
      expect(question.text).toBe('Question 1?'); // From seedTemplate
      expect(question.type).toBe('video');
      expect(question.order).toBe(1);
      expect(question.timeLimit).toBe(60);
      expect(question.required).toBe(true);
      expect(question.createdAt).toBeDefined();
    });

    it('should return questions with multiple choice options', async () => {
      // Arrange - seed template then manually add a multiple choice question
      const templateId = await seedTemplate(dataSource, {
        title: 'Quiz',
        description: 'Test quiz',
        questionsCount: 0,
      });

      // Insert a multiple choice question directly
      const questionId = uuidv4();
      await dataSource.getRepository(QuestionEntity).save({
        id: questionId,
        templateId,
        text: 'What is 2+2?',
        type: 'multiple_choice',
        order: 1,
        timeLimit: 30,
        required: true,
        hints: null,
        options: [
          { id: uuidv4(), text: '3', isCorrect: false },
          { id: uuidv4(), text: '4', isCorrect: true },
          { id: uuidv4(), text: '5', isCorrect: false },
        ],
        createdAt: new Date(),
      });

      // Act
      const query = new GetTemplateQuestionsQuery(templateId);
      const result: QuestionResponseDto[] = await queryBus.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('multiple_choice');
      expect(result[0].options).toBeDefined();
      expect(result[0].options).toHaveLength(3);
    });
  });

  describe('Error Cases', () => {
    it('should throw TemplateNotFoundException for non-existent template', async () => {
      // Arrange
      const nonExistentId = uuidv4();
      const query = new GetTemplateQuestionsQuery(nonExistentId);

      // Act & Assert
      await expect(queryBus.execute(query)).rejects.toThrow(
        TemplateNotFoundException,
      );
    });

    it('should throw error for invalid template ID', async () => {
      // Arrange
      const query = new GetTemplateQuestionsQuery('');

      // Act & Assert
      await expect(queryBus.execute(query)).rejects.toThrow();
    });
  });

  describe('Different Template States', () => {
    it('should return questions from draft template', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Draft Template',
        description: 'Test',
        status: 'draft',
        questionsCount: 2,
      });

      // Act
      const query = new GetTemplateQuestionsQuery(templateId);
      const result: QuestionResponseDto[] = await queryBus.execute(query);

      // Assert
      expect(result).toHaveLength(2);
    });

    it('should return questions from active template', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Active Template',
        description: 'Test',
        status: 'active',
        questionsCount: 3,
      });

      // Act
      const query = new GetTemplateQuestionsQuery(templateId);
      const result: QuestionResponseDto[] = await queryBus.execute(query);

      // Assert
      expect(result).toHaveLength(3);
    });

    it('should return questions from archived template', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Archived Template',
        description: 'Test',
        status: 'archived',
        questionsCount: 2,
      });

      // Act
      const query = new GetTemplateQuestionsQuery(templateId);
      const result: QuestionResponseDto[] = await queryBus.execute(query);

      // Assert - archived templates still have questions visible
      expect(result).toHaveLength(2);
    });
  });

  describe('Multiple Templates Isolation', () => {
    it('should only return questions belonging to the specified template', async () => {
      // Arrange - create two templates with different question counts
      const template1Id = await seedTemplate(dataSource, {
        title: 'Template 1',
        description: 'Test 1',
        questionsCount: 2,
      });

      const template2Id = await seedTemplate(dataSource, {
        title: 'Template 2',
        description: 'Test 2',
        questionsCount: 4,
      });

      // Act
      const result1: QuestionResponseDto[] = await queryBus.execute(
        new GetTemplateQuestionsQuery(template1Id),
      );
      const result2: QuestionResponseDto[] = await queryBus.execute(
        new GetTemplateQuestionsQuery(template2Id),
      );

      // Assert - each query returns only its own questions
      expect(result1).toHaveLength(2);
      expect(result2).toHaveLength(4);
    });
  });
});
