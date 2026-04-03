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
import { UpdateTemplateCommand } from '../../../src/application/commands/update-template/update-template.command';
import { InterviewTemplateEntity } from '../../../src/infrastructure/persistence/entities';
import { InterviewSettings } from '../../../src/domain/value-objects/interview-settings.vo';
import {
  TemplateNotFoundException,
  TemplateUnauthorizedException,
} from '../../../src/domain/exceptions/interview-template.exceptions';
import { mockOutboxService } from '../test-application.module';

describe('UpdateTemplateCommand Integration', () => {
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
    it('should update template title', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Original Title',
        description: 'Original Description',
        createdBy: userId,
      });

      const command = new UpdateTemplateCommand(
        templateId,
        'Updated Title',
        undefined,
        undefined,
        userId,
        'hr',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity!.title).toBe('Updated Title');
      expect(entity!.description).toBe('Original Description');
    });

    it('should update template description', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Title',
        description: 'Original Description',
        createdBy: userId,
      });

      const command = new UpdateTemplateCommand(
        templateId,
        undefined,
        'Updated Description',
        undefined,
        userId,
        'hr',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity!.title).toBe('Title');
      expect(entity!.description).toBe('Updated Description');
    });

    it('should update both title and description', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Old Title',
        description: 'Old Description',
        createdBy: userId,
      });

      const command = new UpdateTemplateCommand(
        templateId,
        'New Title',
        'New Description',
        undefined,
        userId,
        'hr',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity!.title).toBe('New Title');
      expect(entity!.description).toBe('New Description');
    });

    it('should update template settings', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Template',
        description: 'Test',
        createdBy: userId,
      });

      const newSettings = InterviewSettings.create({
        totalTimeLimit: 120,
        allowRetakes: true,
        showTimer: false,
        randomizeQuestions: true,
      });

      const command = new UpdateTemplateCommand(
        templateId,
        undefined,
        undefined,
        newSettings,
        userId,
        'hr',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity!.settings).toEqual({
        totalTimeLimit: 120,
        allowRetakes: true,
        showTimer: false,
        randomizeQuestions: true,
      });
    });

    it('should update metadata and settings simultaneously', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Old Title',
        description: 'Old Description',
        createdBy: userId,
      });

      const newSettings = InterviewSettings.create({
        totalTimeLimit: 90,
        allowRetakes: true,
        showTimer: true,
        randomizeQuestions: false,
      });

      const command = new UpdateTemplateCommand(
        templateId,
        'New Title',
        'New Description',
        newSettings,
        userId,
        'hr',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity!.title).toBe('New Title');
      expect(entity!.description).toBe('New Description');
      expect(entity!.settings).toEqual({
        totalTimeLimit: 90,
        allowRetakes: true,
        showTimer: true,
        randomizeQuestions: false,
      });
    });

    it('should update updatedAt timestamp', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Template',
        description: 'Test',
        createdBy: userId,
      });

      const beforeUpdate = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      const originalUpdatedAt = beforeUpdate!.updatedAt;

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const command = new UpdateTemplateCommand(
        templateId,
        'Updated Title',
        undefined,
        undefined,
        userId,
        'hr',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity!.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime(),
      );
    });

    it('should save outbox event on update', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Template',
        description: 'Test',
        createdBy: userId,
      });

      const command = new UpdateTemplateCommand(
        templateId,
        'Updated',
        undefined,
        undefined,
        userId,
        'hr',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        'template.updated',
        expect.objectContaining({
          templateId,
          updatedAt: expect.any(String),
        }),
        templateId,
        expect.anything(), // transaction
      );
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith([
        'mock-event-id',
      ]);
    });

    it('should allow admin to update any template', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const adminUserId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'HR Template',
        description: 'Owned by HR',
        createdBy: hrUserId,
      });

      const command = new UpdateTemplateCommand(
        templateId,
        'Admin Updated Title',
        undefined,
        undefined,
        adminUserId,
        'admin',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity!.title).toBe('Admin Updated Title');
    });

    it('should trim whitespace from title and description', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Template',
        description: 'Test',
        createdBy: userId,
      });

      const command = new UpdateTemplateCommand(
        templateId,
        '  Trimmed Title  ',
        '  Trimmed Description  ',
        undefined,
        userId,
        'hr',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity!.title).toBe('Trimmed Title');
      expect(entity!.description).toBe('Trimmed Description');
    });
  });

  describe('Error Cases', () => {
    it('should throw TemplateNotFoundException for non-existent template', async () => {
      // Arrange
      const nonExistentId = uuidv4();
      const command = new UpdateTemplateCommand(nonExistentId, 'New Title');

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(
        TemplateNotFoundException,
      );
    });

    it('should throw error when updating archived template', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Archived Template',
        description: 'Cannot modify',
        createdBy: userId,
        status: 'archived',
      });

      const command = new UpdateTemplateCommand(
        templateId,
        'New Title',
        undefined,
        undefined,
        userId,
        'hr',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(/archived/i);
    });

    it('should throw error for empty title', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Template',
        description: 'Test',
        createdBy: userId,
      });

      const command = new UpdateTemplateCommand(
        templateId,
        '',
        undefined,
        undefined,
        userId,
        'hr',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error for empty description', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Template',
        description: 'Test',
        createdBy: userId,
      });

      const command = new UpdateTemplateCommand(
        templateId,
        undefined,
        '',
        undefined,
        userId,
        'hr',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error for title exceeding 200 characters', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Template',
        description: 'Test',
        createdBy: userId,
      });

      const longTitle = 'A'.repeat(201);
      const command = new UpdateTemplateCommand(
        templateId,
        longTitle,
        undefined,
        undefined,
        userId,
        'hr',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error for description exceeding 1000 characters', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Template',
        description: 'Test',
        createdBy: userId,
      });

      const longDescription = 'A'.repeat(1001);
      const command = new UpdateTemplateCommand(
        templateId,
        undefined,
        longDescription,
        undefined,
        userId,
        'hr',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw TemplateUnauthorizedException when HR updates another HR template', async () => {
      // Arrange
      const hr1UserId = uuidv4();
      const hr2UserId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'HR1 Template',
        description: 'Owned by HR1',
        createdBy: hr1UserId,
      });

      const command = new UpdateTemplateCommand(
        templateId,
        'Unauthorized Update',
        undefined,
        undefined,
        hr2UserId,
        'hr',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(
        TemplateUnauthorizedException,
      );

      // Verify template was NOT modified
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity!.title).toBe('HR1 Template');
    });
  });

  describe('Active Template Updates (immutable)', () => {
    it('should reject metadata update on active template', async () => {
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Active Template',
        description: 'Published',
        createdBy: userId,
        status: 'active',
        questionsCount: 1,
      });

      const command = new UpdateTemplateCommand(
        templateId,
        'Updated Active Title',
        undefined,
        undefined,
        userId,
        'hr',
      );

      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should reject settings update on active template', async () => {
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Active Template',
        description: 'Published',
        createdBy: userId,
        status: 'active',
        questionsCount: 1,
      });

      const newSettings = InterviewSettings.create({
        totalTimeLimit: 180,
        allowRetakes: true,
        showTimer: true,
        randomizeQuestions: true,
      });

      const command = new UpdateTemplateCommand(
        templateId,
        undefined,
        undefined,
        newSettings,
        userId,
        'hr',
      );

      await expect(commandBus.execute(command)).rejects.toThrow();
    });
  });
});
