import { INestApplication, NotFoundException, ForbiddenException } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedTemplate,
  seedInvitation,
} from '../setup';
import { GetInvitationQuery } from '../../../src/application/queries/get-invitation/get-invitation.query';
import { SubmitResponseCommand } from '../../../src/application/commands/submit-response/submit-response.command';
import { InvitationResponseDto, InvitationWithTemplateDto } from '../../../src/application/dto/invitation.response.dto';

describe('GetInvitationQuery Integration', () => {
  let app: INestApplication;
  let queryBus: QueryBus;
  let commandBus: CommandBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    queryBus = app.get(QueryBus);
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
    it('should get invitation by candidate', async () => {
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

      // Act
      const query = new GetInvitationQuery(invitationId, candidateId, 'candidate', false);
      const result: InvitationResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.id).toBe(invitationId);
      expect(result.templateId).toBe(templateId);
      expect(result.candidateId).toBe(candidateId);
      expect(result.status).toBe('pending');
      expect(result.progress.answered).toBe(0);
      expect(result.progress.total).toBe(3);
    });

    it('should get invitation by HR (inviter)', async () => {
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
        status: 'pending',
        totalQuestions: 2,
      });

      // Act
      const query = new GetInvitationQuery(invitationId, hrUserId, 'hr', false);
      const result: InvitationResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.id).toBe(invitationId);
      expect(result.invitedBy).toBe(hrUserId);
    });

    it('should get invitation with template (includeTemplate=true)', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Frontend Interview',
        description: 'React questions',
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

      // Act
      const query = new GetInvitationQuery(invitationId, candidateId, 'candidate', true);
      const result: InvitationWithTemplateDto = await queryBus.execute(query);

      // Assert
      expect(result.id).toBe(invitationId);
      expect(result.templateTitle).toBe('Frontend Interview');
      expect(result.templateDescription).toBe('React questions');
      expect(result.questions).toHaveLength(3);
      expect(result.questions[0].text).toBeDefined();
    });

    it('should include responses in result', async () => {
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

      // Submit a response
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

      // Act
      const query = new GetInvitationQuery(invitationId, candidateId, 'candidate', false);
      const result: InvitationResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.responses).toHaveLength(1);
      expect(result.responses[0].textAnswer).toBe('Answer 1');
      expect(result.progress.answered).toBe(1);
      expect(result.progress.percentage).toBe(33); // 1/3 = 33%
    });

    it('should allow admin to access any invitation', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const adminId = uuidv4();

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
        status: 'pending',
        totalQuestions: 2,
      });

      // Act
      const query = new GetInvitationQuery(invitationId, adminId, 'admin', false);
      const result: InvitationResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.id).toBe(invitationId);
    });
  });

  describe('Error Cases', () => {
    it('should throw NotFoundException for non-existent invitation', async () => {
      // Arrange
      const fakeInvitationId = uuidv4();
      const userId = uuidv4();

      // Act & Assert
      const query = new GetInvitationQuery(fakeInvitationId, userId, 'candidate', false);
      await expect(queryBus.execute(query)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const unauthorizedUserId = uuidv4();

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
        status: 'pending',
        totalQuestions: 2,
      });

      // Act & Assert
      const query = new GetInvitationQuery(invitationId, unauthorizedUserId, 'hr', false);
      await expect(queryBus.execute(query)).rejects.toThrow(ForbiddenException);
    });
  });
});
