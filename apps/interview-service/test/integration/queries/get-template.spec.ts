import { INestApplication } from '@nestjs/common';
import { TemplateNotFoundException, TemplateUnauthorizedException } from '../../../src/domain/exceptions/interview-template.exceptions';
import { QueryBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedTemplate,
} from '../setup';
import { GetTemplateQuery } from '../../../src/application/queries/get-template/get-template.query';
import { TemplateResponseDto } from '../../../src/application/dto';

describe('GetTemplateQuery Integration', () => {
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
    it('should get template with questions', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Frontend Interview',
        description: 'React questions',
        createdBy: userId,
        questionsCount: 3,
      });

      // Act
      const query = new GetTemplateQuery(templateId, userId, 'hr');
      const result: TemplateResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.id).toBe(templateId);
      expect(result.title).toBe('Frontend Interview');
      expect(result.description).toBe('React questions');
      expect(result.status).toBe('draft');
      expect(result.createdBy).toBe(userId);
      expect(result.questions).toHaveLength(3);
      expect(result.questionsCount).toBe(3);
      expect(result.settings).toEqual({
        totalTimeLimit: 60,
        allowRetakes: false,
        showTimer: true,
        randomizeQuestions: false,
      });
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should return questions in correct order', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: userId,
        questionsCount: 3,
      });

      // Act
      const query = new GetTemplateQuery(templateId, userId, 'hr');
      const result: TemplateResponseDto = await queryBus.execute(query);

      // Assert - questions sorted by order
      expect(result.questions[0].order).toBe(1);
      expect(result.questions[1].order).toBe(2);
      expect(result.questions[2].order).toBe(3);
    });

    it('should get template without questions (empty)', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Empty Template',
        description: 'No questions yet',
        createdBy: userId,
        questionsCount: 0,
      });

      // Act
      const query = new GetTemplateQuery(templateId, userId, 'hr');
      const result: TemplateResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.questions).toHaveLength(0);
      expect(result.questionsCount).toBe(0);
    });
  });

  describe('RBAC - Role-Based Access Control', () => {
    it('Admin should see any template', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const adminUserId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Template',
        description: 'Test',
        createdBy: hrUserId,
      });

      // Act - Admin user accessing hr's template
      const query = new GetTemplateQuery(templateId, adminUserId, 'admin');
      const result = await queryBus.execute(query);

      // Assert
      expect(result.id).toBe(templateId);
    });

    it('HR should see own template', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Template',
        description: 'Test',
        createdBy: userId,
      });

      // Act - HR user accessing own template
      const query = new GetTemplateQuery(templateId, userId, 'hr');
      const result = await queryBus.execute(query);

      // Assert
      expect(result.id).toBe(templateId);
    });

    it('HR should NOT see other HR template', async () => {
      // Arrange
      const hr1UserId = uuidv4();
      const hr2UserId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Template',
        description: 'Test',
        createdBy: hr1UserId,
      });

      // Act & Assert - HR-2 trying to access HR-1's template
      const query = new GetTemplateQuery(templateId, hr2UserId, 'hr');
      
      await expect(queryBus.execute(query)).rejects.toThrow(TemplateUnauthorizedException);
    });

    it('should allow access without userId for public query', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Template',
        description: 'Test',
        createdBy: userId,
      });

      // Act - No userId (system query)
      const query = new GetTemplateQuery(templateId);
      const result = await queryBus.execute(query);

      // Assert
      expect(result.id).toBe(templateId);
    });
  });

  describe('Error Cases', () => {
    it('should throw NotFoundException for non-existent template', async () => {
      // Act & Assert
      const nonExistentId = uuidv4();
      const query = new GetTemplateQuery(nonExistentId);
      
      await expect(queryBus.execute(query)).rejects.toThrow(TemplateNotFoundException);
    });

    it('should throw error for invalid template ID format', async () => {
      // Act & Assert
      const query = new GetTemplateQuery('');
      
      await expect(queryBus.execute(query)).rejects.toThrow();
    });
  });

  describe('Different Template States', () => {
    it('should get draft template', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Draft',
        description: 'Test',
        createdBy: uuidv4(),
        status: 'draft',
      });

      // Act
      const query = new GetTemplateQuery(templateId);
      const result = await queryBus.execute(query);

      // Assert
      expect(result.status).toBe('draft');
    });

    it('should get active template', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Active',
        description: 'Test',
        createdBy: uuidv4(),
        status: 'active',
      });

      // Act
      const query = new GetTemplateQuery(templateId);
      const result = await queryBus.execute(query);

      // Assert
      expect(result.status).toBe('active');
    });

    it('should get archived template', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Archived',
        description: 'Test',
        createdBy: uuidv4(),
        status: 'archived',
      });

      // Act
      const query = new GetTemplateQuery(templateId);
      const result = await queryBus.execute(query);

      // Assert
      expect(result.status).toBe('archived');
    });
  });
});
