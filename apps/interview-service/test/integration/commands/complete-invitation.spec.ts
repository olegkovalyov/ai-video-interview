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
import { SubmitResponseCommand } from '../../../src/application/commands/submit-response/submit-response.command';
import { CompleteInvitationCommand } from '../../../src/application/commands/complete-invitation/complete-invitation.command';
import { InvitationEntity } from '../../../src/infrastructure/persistence/entities';

describe('CompleteInvitationCommand Integration', () => {
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
    it('should complete invitation with all questions answered (manual)', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Test Interview',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 2,
      });

      const invitationId = await seedInvitation(dataSource, {
        templateId,
        candidateId,
        invitedBy: hrUserId,
        status: 'in_progress',
        totalQuestions: 2,
      });

      // Submit all responses
      await commandBus.execute(
        new SubmitResponseCommand(
          invitationId,
          candidateId,
          uuidv4(),
          0,
          'Question 1?',
          'text',
          60,
          'Answer 1',
        ),
      );
      await commandBus.execute(
        new SubmitResponseCommand(
          invitationId,
          candidateId,
          uuidv4(),
          1,
          'Question 2?',
          'text',
          60,
          'Answer 2',
        ),
      );

      const command = new CompleteInvitationCommand(invitationId, candidateId, 'manual');

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InvitationEntity)
        .findOne({ where: { id: invitationId } });

      expect(entity!.status).toBe('completed');
      expect(entity!.completedAt).toBeDefined();
      expect(entity!.completedReason).toBe('manual');
    });

    it('should auto-complete with partial answers (auto_timeout)', async () => {
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
        status: 'in_progress',
        totalQuestions: 3,
      });

      // Submit only 1 of 3 responses
      await commandBus.execute(
        new SubmitResponseCommand(
          invitationId,
          candidateId,
          uuidv4(),
          0,
          'Question 1?',
          'text',
          60,
          'Answer 1',
        ),
      );

      // Auto-complete by system (userId = null)
      const command = new CompleteInvitationCommand(invitationId, null, 'auto_timeout');

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(InvitationEntity)
        .findOne({ where: { id: invitationId } });

      expect(entity!.status).toBe('completed');
      expect(entity!.completedReason).toBe('auto_timeout');
    });
  });

  describe('Error Cases', () => {
    it('should throw error for non-existent invitation', async () => {
      // Arrange
      const fakeInvitationId = uuidv4();
      const candidateId = uuidv4();

      const command = new CompleteInvitationCommand(fakeInvitationId, candidateId, 'manual');

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error if wrong user tries to complete manually', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const wrongUserId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Test Interview',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 1,
      });

      const invitationId = await seedInvitation(dataSource, {
        templateId,
        candidateId,
        invitedBy: hrUserId,
        status: 'in_progress',
        totalQuestions: 1,
      });

      // Submit all responses
      await commandBus.execute(
        new SubmitResponseCommand(
          invitationId,
          candidateId,
          uuidv4(),
          0,
          'Question?',
          'text',
          60,
          'Answer',
        ),
      );

      const command = new CompleteInvitationCommand(invitationId, wrongUserId, 'manual');

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error if not all questions answered for manual complete', async () => {
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
        status: 'in_progress',
        totalQuestions: 3,
      });

      // Submit only 1 of 3 responses
      await commandBus.execute(
        new SubmitResponseCommand(
          invitationId,
          candidateId,
          uuidv4(),
          0,
          'Question 1?',
          'text',
          60,
          'Answer 1',
        ),
      );

      const command = new CompleteInvitationCommand(invitationId, candidateId, 'manual');

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(
        'All questions must be answered before completing',
      );
    });

    it('should throw error if invitation not in_progress', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Test Interview',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 1,
      });

      const invitationId = await seedInvitation(dataSource, {
        templateId,
        candidateId,
        invitedBy: hrUserId,
        status: 'pending', // Not started
        totalQuestions: 1,
      });

      const command = new CompleteInvitationCommand(invitationId, candidateId, 'manual');

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });
  });
});
