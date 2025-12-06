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
import { CreateInvitationCommand } from '../../../src/application/commands/create-invitation/create-invitation.command';
import { InvitationEntity } from '../../../src/infrastructure/persistence/entities';

describe('CreateInvitationCommand Integration', () => {
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
    it('should create invitation in database', async () => {
      // Arrange: Create active template with questions
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const companyId = uuidv4();
      
      const templateId = await seedTemplate(dataSource, {
        title: 'Frontend Interview',
        description: 'React questions',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 5,
      });

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const command = new CreateInvitationCommand(
        templateId,
        candidateId,
        companyId,
        hrUserId,
        expiresAt,
        true, // allowPause
        true, // showTimer
      );

      // Act
      const invitationId = await commandBus.execute(command);

      // Assert
      expect(invitationId).toBeDefined();
      expect(typeof invitationId).toBe('string');

      // Verify in database
      const entity = await dataSource
        .getRepository(InvitationEntity)
        .findOne({ where: { id: invitationId } });

      expect(entity).toBeDefined();
      expect(entity!.templateId).toBe(templateId);
      expect(entity!.candidateId).toBe(candidateId);
      expect(entity!.companyId).toBe(companyId);
      expect(entity!.invitedBy).toBe(hrUserId);
      expect(entity!.status).toBe('pending');
      expect(entity!.allowPause).toBe(true);
      expect(entity!.showTimer).toBe(true);
      expect(entity!.totalQuestions).toBe(5);
    });

    it('should create invitation with allowPause=false', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const companyId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Strict Interview',
        description: 'No pause allowed',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 3,
      });

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const command = new CreateInvitationCommand(
        templateId,
        candidateId,
        companyId,
        hrUserId,
        expiresAt,
        false, // allowPause
        false, // showTimer
      );

      // Act
      const invitationId = await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InvitationEntity)
        .findOne({ where: { id: invitationId } });

      expect(entity!.allowPause).toBe(false);
      expect(entity!.showTimer).toBe(false);
    });
  });

  describe('Error Cases', () => {
    it('should throw error for non-existent template', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const companyId = uuidv4();
      const fakeTemplateId = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const command = new CreateInvitationCommand(
        fakeTemplateId,
        candidateId,
        companyId,
        hrUserId,
        expiresAt,
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error for non-active template', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const companyId = uuidv4();

      // Template is draft, not active
      const templateId = await seedTemplate(dataSource, {
        title: 'Draft Interview',
        description: 'Not published',
        createdBy: hrUserId,
        status: 'draft',
        questionsCount: 3,
      });

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const command = new CreateInvitationCommand(
        templateId,
        candidateId,
        companyId,
        hrUserId,
        expiresAt,
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(
        'Cannot create invitation for non-active template',
      );
    });

    it('should throw error for duplicate invitation', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const companyId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 3,
      });

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const command = new CreateInvitationCommand(
        templateId,
        candidateId,
        companyId,
        hrUserId,
        expiresAt,
      );

      // First invitation should succeed
      await commandBus.execute(command);

      // Act & Assert: Second invitation should fail
      await expect(commandBus.execute(command)).rejects.toThrow(
        'Invitation for this candidate and template already exists',
      );
    });
  });
});
