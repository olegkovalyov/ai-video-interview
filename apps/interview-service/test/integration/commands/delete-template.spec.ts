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
import { DeleteTemplateCommand } from '../../../src/application/commands/delete-template/delete-template.command';
import { InterviewTemplateEntity } from '../../../src/infrastructure/persistence/entities';
import {
  TemplateNotFoundException,
  TemplateUnauthorizedException,
} from '../../../src/domain/exceptions/interview-template.exceptions';
import { mockOutboxService } from '../test-application.module';

describe('DeleteTemplateCommand Integration', () => {
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
    it('should archive a draft template (soft delete)', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Draft Template',
        description: 'To be deleted',
        createdBy: userId,
        status: 'draft',
      });

      const command = new DeleteTemplateCommand(templateId, userId, 'hr');

      // Act
      await commandBus.execute(command);

      // Assert - template should be archived, not physically deleted
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity).toBeDefined();
      expect(entity!.status).toBe('archived');
    });

    it('should archive an active template', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Active Template',
        description: 'Published template',
        createdBy: userId,
        status: 'active',
        questionsCount: 2,
      });

      const command = new DeleteTemplateCommand(templateId, userId, 'hr');

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity).toBeDefined();
      expect(entity!.status).toBe('archived');
    });

    it('should save outbox event on delete', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Template',
        description: 'Test',
        createdBy: userId,
      });

      const command = new DeleteTemplateCommand(templateId, userId, 'hr');

      // Act
      await commandBus.execute(command);

      // Assert - outbox service should have been called
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        'template.deleted',
        { templateId },
        templateId,
        expect.anything(), // transaction
      );
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith([
        'mock-event-id',
      ]);
    });

    it('should allow admin to delete any template', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const adminUserId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'HR Template',
        description: 'Owned by HR',
        createdBy: hrUserId,
      });

      const command = new DeleteTemplateCommand(
        templateId,
        adminUserId,
        'admin',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity!.status).toBe('archived');
    });

    it('should allow delete without userId/userRole (system call)', async () => {
      // Arrange
      const templateId = await seedTemplate(dataSource, {
        title: 'Template',
        description: 'Test',
      });

      const command = new DeleteTemplateCommand(templateId);

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity!.status).toBe('archived');
    });
  });

  describe('Error Cases', () => {
    it('should throw TemplateNotFoundException for non-existent template', async () => {
      // Arrange
      const nonExistentId = uuidv4();
      const command = new DeleteTemplateCommand(nonExistentId);

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(
        TemplateNotFoundException,
      );
    });

    it('should throw error when archiving already archived template', async () => {
      // Arrange
      const userId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'Archived Template',
        description: 'Already archived',
        createdBy: userId,
        status: 'archived',
      });

      const command = new DeleteTemplateCommand(templateId, userId, 'hr');

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(/archived/i);
    });

    it('should throw TemplateUnauthorizedException when HR deletes another HR template', async () => {
      // Arrange
      const hr1UserId = uuidv4();
      const hr2UserId = uuidv4();
      const templateId = await seedTemplate(dataSource, {
        title: 'HR1 Template',
        description: 'Owned by HR1',
        createdBy: hr1UserId,
      });

      const command = new DeleteTemplateCommand(templateId, hr2UserId, 'hr');

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(
        TemplateUnauthorizedException,
      );

      // Verify template was NOT modified
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity!.status).toBe('draft');
    });
  });
});
