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
import { ResponseEntity, InvitationEntity } from '../../../src/infrastructure/persistence/entities';

describe('SubmitResponseCommand Integration', () => {
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
    it('should submit text response to database', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const questionId = uuidv4();

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
        status: 'in_progress', // Must be in_progress
        totalQuestions: 3,
      });

      const command = new SubmitResponseCommand(
        invitationId,
        candidateId,
        questionId,
        0, // questionIndex
        'What is your experience with React?',
        'text',
        120, // duration
        'I have 5 years of experience with React.', // textAnswer
      );

      // Act
      const responseId = await commandBus.execute(command);

      // Assert
      expect(responseId).toBeDefined();
      expect(typeof responseId).toBe('string');

      // Verify in database
      const entity = await dataSource
        .getRepository(ResponseEntity)
        .findOne({ where: { id: responseId } });

      expect(entity).toBeDefined();
      expect(entity!.invitationId).toBe(invitationId);
      expect(entity!.questionId).toBe(questionId);
      expect(entity!.questionIndex).toBe(0);
      expect(entity!.responseType).toBe('text');
      expect(entity!.textAnswer).toBe('I have 5 years of experience with React.');
      expect(entity!.duration).toBe(120);
    });

    it('should submit code response to database', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const questionId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Code Interview',
        description: 'Coding test',
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

      const codeAnswer = 'function reverse(s) { return s.split("").reverse().join(""); }';

      const command = new SubmitResponseCommand(
        invitationId,
        candidateId,
        questionId,
        0,
        'Write a function to reverse a string.',
        'code',
        180,
        undefined, // textAnswer
        codeAnswer, // codeAnswer
      );

      // Act
      const responseId = await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(ResponseEntity)
        .findOne({ where: { id: responseId } });

      expect(entity!.responseType).toBe('code');
      expect(entity!.codeAnswer).toBe(codeAnswer);
    });

    it('should update lastActivityAt on invitation', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const questionId = uuidv4();

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

      const command = new SubmitResponseCommand(
        invitationId,
        candidateId,
        questionId,
        0,
        'Question?',
        'text',
        60,
        'Answer',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const invitation = await dataSource
        .getRepository(InvitationEntity)
        .findOne({ where: { id: invitationId } });

      expect(invitation!.lastActivityAt).toBeDefined();
    });
  });

  describe('Error Cases', () => {
    it('should throw error for non-existent invitation', async () => {
      // Arrange
      const fakeInvitationId = uuidv4();
      const candidateId = uuidv4();
      const questionId = uuidv4();

      const command = new SubmitResponseCommand(
        fakeInvitationId,
        candidateId,
        questionId,
        0,
        'Question?',
        'text',
        60,
        'Answer',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error if wrong user tries to submit', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const wrongUserId = uuidv4();
      const questionId = uuidv4();

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

      const command = new SubmitResponseCommand(
        invitationId,
        wrongUserId, // Wrong user
        questionId,
        0,
        'Question?',
        'text',
        60,
        'Answer',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error if invitation not in_progress', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const questionId = uuidv4();

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
        status: 'pending', // Not started yet
        totalQuestions: 3,
      });

      const command = new SubmitResponseCommand(
        invitationId,
        candidateId,
        questionId,
        0,
        'Question?',
        'text',
        60,
        'Answer',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error for duplicate response to same question', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const questionId = uuidv4();

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

      const command = new SubmitResponseCommand(
        invitationId,
        candidateId,
        questionId,
        0,
        'Question?',
        'text',
        60,
        'Answer',
      );

      // First response should succeed
      await commandBus.execute(command);

      // Act & Assert: Second response to same question should fail
      await expect(commandBus.execute(command)).rejects.toThrow();
    });
  });
});
