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
import { ListHRInvitationsQuery } from '../../../src/application/queries/list-hr-invitations/list-hr-invitations.query';
import { PaginatedInvitationsResponseDto } from '../../../src/application/dto/invitation.response.dto';

describe('ListHRInvitationsQuery Integration', () => {
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
    it('should list all invitations created by HR', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId1 = uuidv4();
      const candidateId2 = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 2,
      });

      await seedInvitation(dataSource, {
        templateId,
        candidateId: candidateId1,
        invitedBy: hrUserId,
        status: 'pending',
        totalQuestions: 2,
      });

      await seedInvitation(dataSource, {
        templateId,
        candidateId: candidateId2,
        invitedBy: hrUserId,
        status: 'completed',
        totalQuestions: 2,
      });

      // Act
      const query = new ListHRInvitationsQuery(hrUserId, hrUserId, 'hr');
      const result: PaginatedInvitationsResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId1 = uuidv4();
      const candidateId2 = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 2,
      });

      await seedInvitation(dataSource, {
        templateId,
        candidateId: candidateId1,
        invitedBy: hrUserId,
        status: 'pending',
        totalQuestions: 2,
      });

      await seedInvitation(dataSource, {
        templateId,
        candidateId: candidateId2,
        invitedBy: hrUserId,
        status: 'completed',
        totalQuestions: 2,
      });

      // Act - filter by status 'completed'
      const query = new ListHRInvitationsQuery(hrUserId, hrUserId, 'hr', 'completed');
      const result: PaginatedInvitationsResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('completed');
    });

    it('should filter by templateId', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const candidateId1 = uuidv4();
      const candidateId2 = uuidv4();

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
        candidateId: candidateId1,
        invitedBy: hrUserId,
        status: 'pending',
        totalQuestions: 2,
      });

      await seedInvitation(dataSource, {
        templateId: templateId2,
        candidateId: candidateId2,
        invitedBy: hrUserId,
        status: 'pending',
        totalQuestions: 3,
      });

      // Act - filter by templateId1
      const query = new ListHRInvitationsQuery(
        hrUserId,
        hrUserId,
        'hr',
        undefined, // status
        templateId1, // templateId
      );
      const result: PaginatedInvitationsResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].templateId).toBe(templateId1);
    });

    it('should paginate results', async () => {
      // Arrange
      const hrUserId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: hrUserId,
        status: 'active',
        questionsCount: 2,
      });

      // Create 5 invitations for different candidates
      for (let i = 0; i < 5; i++) {
        await seedInvitation(dataSource, {
          templateId,
          candidateId: uuidv4(),
          invitedBy: hrUserId,
          status: 'pending',
          totalQuestions: 2,
        });
      }

      // Act - get page 2 with limit 2
      const query = new ListHRInvitationsQuery(
        hrUserId,
        hrUserId,
        'hr',
        undefined, // status
        undefined, // templateId
        2, // page
        2, // limit
      );
      const result: PaginatedInvitationsResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should not see invitations created by other HR', async () => {
      // Arrange
      const hrUserId1 = uuidv4();
      const hrUserId2 = uuidv4();
      const candidateId = uuidv4();

      const templateId = await seedTemplate(dataSource, {
        title: 'Interview',
        description: 'Test',
        createdBy: hrUserId1,
        status: 'active',
        questionsCount: 2,
      });

      await seedInvitation(dataSource, {
        templateId,
        candidateId,
        invitedBy: hrUserId1, // Created by HR1
        status: 'pending',
        totalQuestions: 2,
      });

      // Act - HR2 queries their invitations
      const query = new ListHRInvitationsQuery(hrUserId2, hrUserId2, 'hr');
      const result: PaginatedInvitationsResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(0);
    });

    it('should allow admin to list any HR invitations', async () => {
      // Arrange
      const hrUserId = uuidv4();
      const adminId = uuidv4();
      const candidateId = uuidv4();

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
      const query = new ListHRInvitationsQuery(hrUserId, adminId, 'admin');
      const result: PaginatedInvitationsResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(1);
    });
  });

  describe('Error Cases', () => {
    it('should throw ForbiddenException if HR tries to see another HR invitations', async () => {
      // Arrange
      const hrUserId1 = uuidv4();
      const hrUserId2 = uuidv4();

      // Act & Assert
      const query = new ListHRInvitationsQuery(hrUserId1, hrUserId2, 'hr');
      await expect(queryBus.execute(query)).rejects.toThrow(InvitationAccessDeniedException);
    });
  });
});
