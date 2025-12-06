import { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedTemplate,
  seedInvitation,
} from '../setup';
import { StartInvitationCommand } from '../../../src/application/commands/start-invitation/start-invitation.command';
import { InvitationEntity } from '../../../src/infrastructure/persistence/entities';

describe('StartInvitationCommand Integration', () => {
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
    it('should start invitation and update status to in_progress', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Test Interview',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 3,
      });

      const invitationId = await seedInvitation(dataSource, {
        templateId,
        candidateId,
        invitedBy: hrUserId,
        status: 'pending',
        totalQuestions: 3,
      });

      const command = new StartInvitationCommand(invitationId, candidateId);

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InvitationEntity)
        .findOne({ where: { id: invitationId } });

      expect(entity!.status).toBe('in_progress');
      expect(entity!.startedAt).toBeDefined();
      expect(entity!.lastActivityAt).toBeDefined();
    });
  });

  describe('Error Cases', () => {
    it('should throw error for non-existent invitation', async () => {
      // Arrange
      const fakeInvitationId = uuidv4();
      const candidateId = uuidv4();

      const command = new StartInvitationCommand(fakeInvitationId, candidateId);

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error if wrong user tries to start', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const wrongUserId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Test Interview',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 3,
      });

      const invitationId = await seedInvitation(dataSource, {
        templateId,
        candidateId,
        invitedBy: hrUserId,
        status: 'pending',
        totalQuestions: 3,
      });

      const command = new StartInvitationCommand(invitationId, wrongUserId);

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error if invitation already started', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Test Interview',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 3,
      });

      const invitationId = await seedInvitation(dataSource, {
        templateId,
        candidateId,
        invitedBy: hrUserId,
        status: 'in_progress', // Already started
        totalQuestions: 3,
      });

      const command = new StartInvitationCommand(invitationId, candidateId);

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error if invitation expired', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Test Interview',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 3,
      });

      const invitationId = await seedInvitation(dataSource, {
        templateId,
        candidateId,
        invitedBy: hrUserId,
        status: 'pending',
        totalQuestions: 3,
        expiresAt: new Date(Date.now() - 1000), // Already expired
      });

      const command = new StartInvitationCommand(invitationId, candidateId);

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });
  });
});
