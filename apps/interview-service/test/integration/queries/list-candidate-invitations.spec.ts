import { INestApplication } from '@nestjs/common';
import { InvitationAccessDeniedException } from '../../../src/domain/exceptions/invitation.exceptions';
import { QueryBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedTemplate,
  seedInvitation,
} from '../setup';
import { ListCandidateInvitationsQuery } from '../../../src/application/queries/list-candidate-invitations/list-candidate-invitations.query';
import { PaginatedInvitationsResponseDto } from '../../../src/application/dto/invitation.response.dto';

describe('ListCandidateInvitationsQuery Integration', () => {
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
    it('should list all invitations for candidate', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();

      const templateId1 = await seedTemplate(dataSource, {
        title: 'Interview 1',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 2,
      });

      const templateId2 = await seedTemplate(dataSource, {
        title: 'Interview 2',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 3,
      });

      await seedInvitation(dataSource, {
        templateId: templateId1,
        candidateId,
        invitedBy: hrUserId,
        status: 'pending',
        totalQuestions: 2,
      });

      await seedInvitation(dataSource, {
        templateId: templateId2,
        candidateId,
        invitedBy: hrUserId,
        status: 'in_progress',
        totalQuestions: 3,
      });

      // Act
      const query = new ListCandidateInvitationsQuery(candidateId, candidateId, 'candidate');
      const result: PaginatedInvitationsResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should filter by status', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();

      const templateId1 = await seedTemplate(dataSource, {
        title: 'Interview 1',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 2,
      });

      const templateId2 = await seedTemplate(dataSource, {
        title: 'Interview 2',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 3,
      });

      await seedInvitation(dataSource, {
        templateId: templateId1,
        candidateId,
        invitedBy: hrUserId,
        status: 'pending',
        totalQuestions: 2,
      });

      await seedInvitation(dataSource, {
        templateId: templateId2,
        candidateId,
        invitedBy: hrUserId,
        status: 'completed',
        totalQuestions: 3,
      });

      // Act - filter by status 'pending'
      const query = new ListCandidateInvitationsQuery(candidateId, candidateId, 'candidate', 'pending');
      const result: PaginatedInvitationsResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('pending');
    });

    it('should paginate results', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();

      // Create 5 templates and invitations
      for (let i = 0; i < 5; i++) {
        const templateId = await seedTemplate(dataSource, {
          title: `Interview ${i}`,
          description: 'Test',
          createdBy: hrUserId,
          status: 'active',
          questionsCount: 2,
        });

        await seedInvitation(dataSource, {
          templateId,
          candidateId,
          invitedBy: hrUserId,
          status: 'pending',
          totalQuestions: 2,
        });
      }

      // Act - get page 1 with limit 2
      const query = new ListCandidateInvitationsQuery(
        candidateId,
        candidateId,
        'candidate',
        undefined, // status
        1, // page
        2, // limit
      );
      const result: PaginatedInvitationsResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should return empty list for candidate with no invitations', async () => {
      // Arrange
      const candidateId = uuidv4();

      // Act
      const query = new ListCandidateInvitationsQuery(candidateId, candidateId, 'candidate');
      const result: PaginatedInvitationsResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should allow admin to list any candidate invitations', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const adminId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 2,
      });

      await seedInvitation(dataSource, {
        templateId,
        candidateId,
        invitedBy: hrUserId,
        status: 'pending',
        totalQuestions: 2,
      });

      // Act
      const query = new ListCandidateInvitationsQuery(candidateId, adminId, 'admin');
      const result: PaginatedInvitationsResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(1);
    });
  });

  describe('Error Cases', () => {
    it('should throw ForbiddenException if candidate tries to see another candidates invitations', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId = uuidv4();
      const otherCandidateId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 2,
      });

      await seedInvitation(dataSource, {
        templateId,
        candidateId,
        invitedBy: hrUserId,
        status: 'pending',
        totalQuestions: 2,
      });

      // Act & Assert
      const query = new ListCandidateInvitationsQuery(candidateId, otherCandidateId, 'candidate');
      await expect(queryBus.execute(query)).rejects.toThrow(InvitationAccessDeniedException);
    });
  });
});
