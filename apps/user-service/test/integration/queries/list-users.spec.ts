import { INestApplication } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedUser,
} from '../setup';
import { ListUsersQuery } from '../../../src/application/queries/list-users/list-users.query';

describe('ListUsersQuery Integration', () => {
  let app: INestApplication;
  let queryBus: QueryBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    queryBus = app.get(QueryBus);
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
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
    beforeEach(async () => {
      // Seed 25 users for pagination tests
      for (let i = 1; i <= 25; i++) {
        await seedUser(dataSource, {
          email: `user${i}@example.com`,
          firstName: `User`,
          lastName: `${i}`,
        });
      }
    });

    it('should return first page with default limit (20)', async () => {
      // Arrange
      const query = new ListUsersQuery(1, 20, {});

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(20);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(2);
    });

    it('should return second page with remaining users', async () => {
      // Arrange
      const query = new ListUsersQuery(2, 20, {});

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(5); // 25 - 20 = 5
      expect(result.page).toBe(2);
      expect(result.total).toBe(25);
    });

    it('should respect custom limit', async () => {
      // Arrange
      const query = new ListUsersQuery(1, 10, {});

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(10);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3); // 25 / 10 = 2.5 → 3 pages
    });

    it('should return empty array for page beyond total pages', async () => {
      // Arrange
      const query = new ListUsersQuery(10, 20, {});

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.page).toBe(10);
      // Total should be at least 25 (from beforeEach), could be more if other tests ran
      expect(result.total).toBeGreaterThanOrEqual(25);
    });
  });

  describe('Search Filter', () => {
    beforeEach(async () => {
      await seedUser(dataSource, {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });
      await seedUser(dataSource, {
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      });
      await seedUser(dataSource, {
        email: 'bob.johnson@example.com',
        firstName: 'Bob',
        lastName: 'Johnson',
      });
    });

    it('should filter by email', async () => {
      // Arrange
      const query = new ListUsersQuery(1, 20, { search: 'john' });

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(2); // john.doe and bob.johnson
      expect(result.total).toBe(2);
    });

    it('should filter by first name', async () => {
      // Arrange
      const query = new ListUsersQuery(1, 20, { search: 'Jane' });

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].fullName.firstName).toBe('Jane');
    });

    it('should filter by last name', async () => {
      // Arrange
      const query = new ListUsersQuery(1, 20, { search: 'Smith' });

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].fullName.lastName).toBe('Smith');
    });

    it('should be case-insensitive', async () => {
      // Arrange
      const query = new ListUsersQuery(1, 20, { search: 'JOHN' });

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('Role Filter', () => {
    beforeEach(async () => {
      await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Can',
        lastName: 'Didate',
        role: 'candidate',
      });
      await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'HR',
        lastName: 'User',
        role: 'hr',
      });
      await seedUser(dataSource, {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      });
    });

    it('should filter by candidate role', async () => {
      // Arrange
      const query = new ListUsersQuery(1, 20, { role: 'candidate' });

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].role.toString()).toBe('candidate');
    });

    it('should filter by HR role', async () => {
      // Arrange
      const query = new ListUsersQuery(1, 20, { role: 'hr' });

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].role.toString()).toBe('hr');
    });
  });

  describe('Status Filter', () => {
    beforeEach(async () => {
      await seedUser(dataSource, {
        email: 'active@example.com',
        firstName: 'Active',
        lastName: 'User',
        status: 'active',
      });
      await seedUser(dataSource, {
        email: 'suspended@example.com',
        firstName: 'Suspended',
        lastName: 'User',
        status: 'suspended',
      });
    });

    it('should filter by active status', async () => {
      // Arrange
      const query = new ListUsersQuery(1, 20, { status: 'active' });

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status.value).toBe('active');
    });

    it('should filter by suspended status', async () => {
      // Arrange
      const query = new ListUsersQuery(1, 20, { status: 'suspended' });

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status.value).toBe('suspended');
    });
  });

  describe('Combined Filters', () => {
    beforeEach(async () => {
      await seedUser(dataSource, {
        email: 'john.candidate@example.com',
        firstName: 'John',
        lastName: 'Candidate',
        role: 'candidate',
        status: 'active',
      });
      await seedUser(dataSource, {
        email: 'john.hr@example.com',
        firstName: 'John',
        lastName: 'HR',
        role: 'hr',
        status: 'active',
      });
      await seedUser(dataSource, {
        email: 'jane.candidate@example.com',
        firstName: 'Jane',
        lastName: 'Candidate',
        role: 'candidate',
        status: 'suspended',
      });
    });

    it('should filter by search and role', async () => {
      // Arrange
      const query = new ListUsersQuery(1, 20, {
        search: 'John',
        role: 'candidate',
      });

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].email.value).toBe('john.candidate@example.com');
    });

    it('should filter by role and status', async () => {
      // Arrange
      const query = new ListUsersQuery(1, 20, {
        role: 'candidate',
        status: 'active',
      });

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].email.value).toBe('john.candidate@example.com');
    });

    it('should filter by all criteria', async () => {
      // Arrange
      const query = new ListUsersQuery(1, 20, {
        search: 'Jane',
        role: 'candidate',
        status: 'suspended',
      });

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].email.value).toBe('jane.candidate@example.com');
    });
  });

  describe('Empty Results', () => {
    it('should return empty array when no users exist', async () => {
      // Arrange
      const query = new ListUsersQuery(1, 20, {});

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should return empty array when no users match filters', async () => {
      // Arrange
      await seedUser(dataSource, {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      const query = new ListUsersQuery(1, 20, { search: 'NonExistent' });

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
