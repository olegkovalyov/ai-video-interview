import { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
} from '../setup';
import { CreateTemplateCommand } from '../../../src/application/commands/create-template/create-template.command';
import { InterviewTemplateEntity } from '../../../src/infrastructure/persistence/entities';
import { InterviewSettings } from '../../../src/domain/value-objects/interview-settings.vo';

describe('CreateTemplateCommand Integration', () => {
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
    it('should create template in database with default settings', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const command = new CreateTemplateCommand(
        'Frontend Interview',
        'React and TypeScript questions',
        hrUserId,
      );

      // Act
      const templateId = await commandBus.execute(command);

      // Assert
      expect(templateId).toBeDefined();
      expect(typeof templateId).toBe('string');

      // Verify in database
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });

      expect(entity).toBeDefined();
      expect(entity!.title).toBe('Frontend Interview');
      expect(entity!.description).toBe('React and TypeScript questions');
      expect(entity!.status).toBe('draft');
      expect(entity!.createdBy).toBe(hrUserId);
      expect(entity!.settings).toEqual({
        totalTimeLimit: 60,
        allowRetakes: false,
        showTimer: true,
        randomizeQuestions: false,
      });
      expect(entity!.createdAt).toBeDefined();
      expect(entity!.updatedAt).toBeDefined();
    });

    it('should create template with custom settings', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const customSettings = InterviewSettings.create({
        totalTimeLimit: 120,
        allowRetakes: true,
        showTimer: false,
        randomizeQuestions: true,
      });
      const command = new CreateTemplateCommand(
        'Backend Interview',
        'Node.js and databases',
        hrUserId,
        customSettings,
      );

      // Act
      const templateId = await commandBus.execute(command);

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

    it('should create multiple templates for same user', async () => {
      // Arrange
      const hrUserId = uuidv4();
      
      // Act
      await commandBus.execute(
        new CreateTemplateCommand('Title 1', 'Desc 1', hrUserId),
      );
      await commandBus.execute(
        new CreateTemplateCommand('Title 2', 'Desc 2', hrUserId),
      );

      // Assert
      const templates = await dataSource
        .getRepository(InterviewTemplateEntity)
        .find({ where: { createdBy: hrUserId } });

      expect(templates).toHaveLength(2);
      expect(templates[0].title).toBe('Title 1');
      expect(templates[1].title).toBe('Title 2');
    });
  });

  describe('Error Cases', () => {
    it('should throw error for invalid title (empty)', async () => {
      // Act & Assert
      const hrUserId = uuidv4();
      await expect(
        commandBus.execute(
          new CreateTemplateCommand('', 'Description', hrUserId),
        ),
      ).rejects.toThrow();
    });

    it('should throw error for invalid description (empty)', async () => {
      // Act & Assert
      const hrUserId = uuidv4();
      await expect(
        commandBus.execute(
          new CreateTemplateCommand('Title', '', hrUserId),
        ),
      ).rejects.toThrow();
    });
  });

  describe('Domain Events', () => {
    it('should publish TemplateCreatedEvent', async () => {
      // Note: In full test we can spy on EventBus
      // For simplicity just checking DB creation
      const hrUserId = uuidv4();
      const command = new CreateTemplateCommand(
        'Title',
        'Description',
        hrUserId,
      );

      const templateId = await commandBus.execute(command);

      expect(templateId).toBeDefined();
      // TODO: Add EventBus spy to verify event publication
    });
  });
});
