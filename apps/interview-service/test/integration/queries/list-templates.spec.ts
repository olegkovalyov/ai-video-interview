import { INestApplication } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedTemplate,
} from '../setup';
import { ListTemplatesQuery } from '../../../src/application/queries/list-templates/list-templates.query';
import { PaginatedTemplatesResponseDto } from '../../../src/application/dto';

describe('ListTemplatesQuery Integration', () => {
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

  describe('Pagination', () => {
    let hrUserId: string;

    beforeEach(async () => {
      hrUserId = uuidv4();
      // Seed 15 templates
      for (let i = 1; i <= 15; i++) {
        await seedTemplate(dataSource, {
          title: `Template ${i}`,
          description: `Description ${i}`,
          createdBy: hrUserId,
          questionsCount: 2,
        });
      }
    });

    it('should return first page with default limit (10)', async () => {
      // Act
      const query = new ListTemplatesQuery(hrUserId, 'hr', undefined, 1, 10);
      const result: PaginatedTemplatesResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(2);
    });

    it('should return second page', async () => {
      // Act
      const query = new ListTemplatesQuery(hrUserId, 'hr', undefined, 2, 10);
      const result: PaginatedTemplatesResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(5); // Remaining items
      expect(result.total).toBe(15);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should support custom page size', async () => {
      // Act
      const query = new ListTemplatesQuery(hrUserId, 'hr', undefined, 1, 5);
      const result: PaginatedTemplatesResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(15);
      expect(result.totalPages).toBe(3);
    });

    it('should return empty array for page beyond total', async () => {
      // Act
      const query = new ListTemplatesQuery(hrUserId, 'hr', undefined, 10, 10);
      const result: PaginatedTemplatesResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(15);
    });
  });

  describe('Filters', () => {
    let hr1UserId: string;
    let hr2UserId: string;

    beforeEach(async () => {
      hr1UserId = uuidv4();
      hr2UserId = uuidv4();
      // Seed templates with different statuses and owners
      await seedTemplate(dataSource, {
        title: 'T1',
        description: 'D1',
        createdBy: hr1UserId,
        status: 'draft',
        questionsCount: 1,
      });
      await seedTemplate(dataSource, {
        title: 'T2',
        description: 'D2',
        createdBy: hr1UserId,
        status: 'active',
        questionsCount: 2,
      });
      await seedTemplate(dataSource, {
        title: 'T3',
        description: 'D3',
        createdBy: hr2UserId,
        status: 'draft',
        questionsCount: 1,
      });
      await seedTemplate(dataSource, {
        title: 'T4',
        description: 'D4',
        createdBy: hr2UserId,
        status: 'active',
        questionsCount: 3,
      });
    });

    it('should filter by status (draft)', async () => {
      // Act
      const adminUserId = uuidv4();
      const query = new ListTemplatesQuery(adminUserId, 'admin', 'draft', 1, 10);
      const result: PaginatedTemplatesResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.items.every((t) => t.status === 'draft')).toBe(true);
    });

    it('should filter by status (active)', async () => {
      // Act
      const adminUserId = uuidv4();
      const query = new ListTemplatesQuery(adminUserId, 'admin', 'active', 1, 10);
      const result: PaginatedTemplatesResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.items.every((t) => t.status === 'active')).toBe(true);
    });

    it('should return all templates without status filter', async () => {
      // Act
      const adminUserId = uuidv4();
      const query = new ListTemplatesQuery(adminUserId, 'admin', undefined, 1, 10);
      const result: PaginatedTemplatesResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(4);
    });
  });

  describe('RBAC - Role-Based Access Control', () => {
    let hr1UserId: string;
    let hr2UserId: string;
    let t1Id: string;

    beforeEach(async () => {
      hr1UserId = uuidv4();
      hr2UserId = uuidv4();
      t1Id = await seedTemplate(dataSource, {
        title: 'HR-1 Template 1',
        description: 'D1',
        createdBy: hr1UserId,
        status: 'draft',
      });
      await seedTemplate(dataSource, {
        title: 'HR-1 Template 2',
        description: 'D2',
        createdBy: hr1UserId,
        status: 'active',
      });
      await seedTemplate(dataSource, {
        title: 'HR-2 Template',
        description: 'D3',
        createdBy: hr2UserId,
        status: 'draft',
      });
    });

    it('Admin should see all templates', async () => {
      // Act
      const adminUserId = uuidv4();
      const query = new ListTemplatesQuery(adminUserId, 'admin', undefined, 1, 10);
      const result: PaginatedTemplatesResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(3);
    });

    it('HR should see only own templates', async () => {
      // Act
      const query = new ListTemplatesQuery(hr1UserId, 'hr', undefined, 1, 10);
      const result: PaginatedTemplatesResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.items.every((t) => t.createdBy === hr1UserId)).toBe(true);
    });

    it('HR with status filter should see only own templates with that status', async () => {
      // Act
      const query = new ListTemplatesQuery(hr1UserId, 'hr', 'draft', 1, 10);
      const result: PaginatedTemplatesResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(t1Id);
      expect(result.items[0].createdBy).toBe(hr1UserId);
      expect(result.items[0].status).toBe('draft');
    });
  });

  describe('Template Details', () => {
    it('should include questions count in list items', async () => {
      // Arrange
      const hrUserId = uuidv4();
      await seedTemplate(dataSource, {
        title: 'Template 1',
        description: 'D1',
        createdBy: hrUserId,
        questionsCount: 5,
      });

      // Act
      const query = new ListTemplatesQuery(hrUserId, 'hr', undefined, 1, 10);
      const result: PaginatedTemplatesResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items[0].questionsCount).toBe(5);
    });

    it('should return templates ordered by createdAt DESC', async () => {
      // Arrange - create templates with different times
      const hrUserId = uuidv4();
      const t1Id = await seedTemplate(dataSource, {
        title: 'First',
        description: 'D1',
        createdBy: hrUserId,
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const t2Id = await seedTemplate(dataSource, {
        title: 'Second',
        description: 'D2',
        createdBy: hrUserId,
      });

      // Act
      const query = new ListTemplatesQuery(hrUserId, 'hr', undefined, 1, 10);
      const result: PaginatedTemplatesResponseDto = await queryBus.execute(query);

      // Assert - newest first
      expect(result.items[0].id).toBe(t2Id);
      expect(result.items[1].id).toBe(t1Id);
    });
  });

  describe('Empty Results', () => {
    it('should return empty list for HR with no templates', async () => {
      // Act
      const hrNewUserId = uuidv4();
      const query = new ListTemplatesQuery(hrNewUserId, 'hr', undefined, 1, 10);
      const result: PaginatedTemplatesResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should return empty list when no templates match filter', async () => {
      // Arrange - only draft templates
      const hrUserId = uuidv4();
      await seedTemplate(dataSource, {
        title: 'Draft Template',
        description: 'D1',
        createdBy: hrUserId,
        status: 'draft',
      });

      // Act - filter by active
      const query = new ListTemplatesQuery(hrUserId, 'hr', 'active', 1, 10);
      const result: PaginatedTemplatesResponseDto = await queryBus.execute(query);

      // Assert
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
