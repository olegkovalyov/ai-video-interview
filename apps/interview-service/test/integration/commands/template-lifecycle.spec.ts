import { INestApplication } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
} from '../setup';
import { v4 as uuidv4 } from 'uuid';
import { CreateTemplateCommand } from '../../../src/application/commands/create-template/create-template.command';
import { AddQuestionCommand } from '../../../src/application/commands/add-question/add-question.command';
import { PublishTemplateCommand } from '../../../src/application/commands/publish-template/publish-template.command';
import { DeleteTemplateCommand } from '../../../src/application/commands/delete-template/delete-template.command';
import { GetTemplateQuery } from '../../../src/application/queries/get-template/get-template.query';
import { InterviewTemplateEntity } from '../../../src/infrastructure/persistence/entities';
import { TemplateResponseDto } from '../../../src/application/dto';
import { InterviewSettings } from '../../../src/domain/value-objects/interview-settings.vo';

describe('Template Lifecycle Integration', () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    commandBus = app.get(CommandBus);
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

  describe('Complete Template Lifecycle', () => {
    it('should create → add questions → publish → delete template', async () => {
      // 1. CREATE TEMPLATE
      const createdBy = uuidv4();
      const createCmd = new CreateTemplateCommand(
        'Senior Frontend Developer Interview',
        'Comprehensive interview for React expertise',
        createdBy,
        InterviewSettings.create({
          totalTimeLimit: 120,
          allowRetakes: false,
          showTimer: true,
          randomizeQuestions: false,
        }),
      );

      const templateId = await commandBus.execute(createCmd);
      expect(templateId).toBeDefined();
      expect(typeof templateId).toBe('string');

      // Verify in DB - should be draft
      let entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });
      expect(entity!.status).toBe('draft');

      // 2. ADD QUESTIONS
      await commandBus.execute(
        new AddQuestionCommand(
          templateId,
          'Tell me about your React experience',
          'video',
          1,
          120,
          true,
          'Focus on hooks and state management',
        ),
      );

      await commandBus.execute(
        new AddQuestionCommand(
          templateId,
          'Explain the concept of Virtual DOM',
          'text',
          2,
          60,
          true,
        ),
      );

      await commandBus.execute(
        new AddQuestionCommand(
          templateId,
          'What is your preferred state management solution?',
          'multiple_choice',
          3,
          30,
          false,
          'Redux, MobX, Zustand, or Context API',
        ),
      );

      // Verify questions added
      const templateWithQuestions: TemplateResponseDto = await queryBus.execute(
        new GetTemplateQuery(templateId),
      );
      expect(templateWithQuestions.questions).toHaveLength(3);
      expect(templateWithQuestions.status).toBe('draft');

      // 3. PUBLISH TEMPLATE
      await commandBus.execute(new PublishTemplateCommand(templateId));

      // Verify status changed to active
      entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });
      expect(entity!.status).toBe('active');

      const publishedTemplate: TemplateResponseDto = await queryBus.execute(
        new GetTemplateQuery(templateId),
      );
      expect(publishedTemplate.status).toBe('active');
      expect(publishedTemplate.questions).toHaveLength(3);

      // 4. DELETE (ARCHIVE) TEMPLATE
      await commandBus.execute(new DeleteTemplateCommand(templateId));

      // Verify status changed to archived
      entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });
      expect(entity!.status).toBe('archived');

      const archivedTemplate: TemplateResponseDto = await queryBus.execute(
        new GetTemplateQuery(templateId),
      );
      expect(archivedTemplate.status).toBe('archived');
      expect(archivedTemplate.questions).toHaveLength(3); // Questions still exist
    });

    it('should not allow adding questions to archived template', async () => {
      // 1. Create and archive
      const templateId = await commandBus.execute(
        new CreateTemplateCommand('Interview Template', 'Description here', uuidv4()),
      );
      await commandBus.execute(new DeleteTemplateCommand(templateId));

      // 2. Try to add question to archived template
      await expect(
        commandBus.execute(
          new AddQuestionCommand(templateId, 'What is your experience?', 'video', 1, 60),
        ),
      ).rejects.toThrow(/archived/i);
    });

    it('should not allow publishing template without questions', async () => {
      // 1. Create template without questions
      const templateId = await commandBus.execute(
        new CreateTemplateCommand('Interview Template', 'Description here', uuidv4()),
      );

      // 2. Try to publish
      await expect(
        commandBus.execute(new PublishTemplateCommand(templateId)),
      ).rejects.toThrow(/question/i);
    });

    it('should allow publishing template with at least one question', async () => {
      // 1. Create template
      const templateId = await commandBus.execute(
        new CreateTemplateCommand('Interview Template', 'Description here', uuidv4()),
      );

      // 2. Add one question
      await commandBus.execute(
        new AddQuestionCommand(templateId, 'What is your experience?', 'video', 1, 60),
      );

      // 3. Publish should succeed
      await commandBus.execute(new PublishTemplateCommand(templateId));

      // Verify
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id: templateId } });
      expect(entity!.status).toBe('active');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple questions added to same template', async () => {
      // 1. Create template
      const templateId = await commandBus.execute(
        new CreateTemplateCommand('Interview Template', 'Description here', uuidv4()),
      );

      // 2. Add multiple questions in parallel
      await Promise.all([
        commandBus.execute(
          new AddQuestionCommand(templateId, 'What is your experience?', 'video', 1, 60),
        ),
        commandBus.execute(
          new AddQuestionCommand(templateId, 'Describe your skills', 'text', 2, 60),
        ),
        commandBus.execute(
          new AddQuestionCommand(templateId, 'Tell us about your project', 'video', 3, 60),
        ),
      ]);

      // 3. Verify all questions saved
      const template: TemplateResponseDto = await queryBus.execute(
        new GetTemplateQuery(templateId),
      );
      expect(template.questions).toHaveLength(3);
    });
  });

  describe('State Transitions', () => {
    it('should allow draft → active transition', async () => {
      // Create and add question
      const id = await commandBus.execute(
        new CreateTemplateCommand('Interview Template', 'Description here', uuidv4()),
      );
      await commandBus.execute(
        new AddQuestionCommand(id, 'What is your experience?', 'video', 1, 60),
      );

      // Publish
      await commandBus.execute(new PublishTemplateCommand(id));

      // Verify
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id } });
      expect(entity!.status).toBe('active');
    });

    it('should allow active → archived transition', async () => {
      // Create, add question, publish
      const id = await commandBus.execute(
        new CreateTemplateCommand('Interview Template', 'Description here', uuidv4()),
      );
      await commandBus.execute(
        new AddQuestionCommand(id, 'What is your experience?', 'video', 1, 60),
      );
      await commandBus.execute(new PublishTemplateCommand(id));

      // Archive
      await commandBus.execute(new DeleteTemplateCommand(id));

      // Verify
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id } });
      expect(entity!.status).toBe('archived');
    });

    it('should allow draft → archived transition (delete before publish)', async () => {
      // Create
      const id = await commandBus.execute(
        new CreateTemplateCommand('Interview Template', 'Description here', uuidv4()),
      );

      // Delete without publishing
      await commandBus.execute(new DeleteTemplateCommand(id));

      // Verify
      const entity = await dataSource
        .getRepository(InterviewTemplateEntity)
        .findOne({ where: { id } });
      expect(entity!.status).toBe('archived');
    });
  });
});
