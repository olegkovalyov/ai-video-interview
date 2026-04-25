import type { INestApplication } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import type { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedUser,
} from '../../setup';
import { CreateCompanyCommand } from '../../../../src/application/commands/hr/create-company/create-company.command';
import { ListCompaniesQuery } from '../../../../src/application/queries/companies/list-companies.query';

describe('ListCompaniesQuery Integration', () => {
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
    it('should list companies for specific HR user', async () => {
      // Arrange - Create HR user and companies
      const hrId = await seedUser(dataSource, {
        email: 'hr@test.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: 'hr',
      });

      // Create 3 companies
      await commandBus.execute(
        new CreateCompanyCommand({
          name: 'Tech Corp',
          description: 'Leading tech company',
          website: 'https://techcorp.com',
          logoUrl: null,
          industry: 'Technology',
          size: '51-200',
          location: 'San Francisco, CA',
          position: null,
          createdBy: hrId,
        }),
      );

      await commandBus.execute(
        new CreateCompanyCommand({
          name: 'Finance Inc',
          description: 'Financial services',
          website: 'https://finance.com',
          logoUrl: null,
          industry: 'Finance',
          size: '200+',
          location: 'New York, NY',
          position: null,
          createdBy: hrId,
        }),
      );

      await commandBus.execute(
        new CreateCompanyCommand({
          name: 'Health Plus',
          description: 'Healthcare provider',
          website: 'https://health.com',
          logoUrl: null,
          industry: 'Healthcare',
          size: '11-50',
          location: 'Boston, MA',
          position: null,
          createdBy: hrId,
        }),
      );

      // Act
      const query = new ListCompaniesQuery({
        page: 1,
        limit: 10,
        isActive: undefined,
        search: undefined,
        createdBy: undefined,
        currentUserId: hrId,
        isAdmin: false,
      });
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data.length).toBe(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(3); // MVP: limit equals data length for HR users

      // Verify structure
      const company = result.data[0];
      expect(company).toHaveProperty('id');
      expect(company).toHaveProperty('name');
      expect(company).toHaveProperty('description');
      expect(company).toHaveProperty('website');
      expect(company).toHaveProperty('industry');
      expect(company).toHaveProperty('size');
      expect(company).toHaveProperty('location');
      expect(company).toHaveProperty('createdAt');
      expect(company).toHaveProperty('updatedAt');
    });

    it('should list all companies for HR user', async () => {
      // Arrange
      const hrId = await seedUser(dataSource, {
        email: 'hr@test.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: 'hr',
      });

      // Create companies
      await commandBus.execute(
        new CreateCompanyCommand({
          name: 'Tech Corp 1',
          description: null,
          website: null,
          logoUrl: null,
          industry: 'Technology',
          size: null,
          location: null,
          position: null,
          createdBy: hrId,
        }),
      );

      await commandBus.execute(
        new CreateCompanyCommand({
          name: 'Tech Corp 2',
          description: null,
          website: null,
          logoUrl: null,
          industry: 'Technology',
          size: null,
          location: null,
          position: null,
          createdBy: hrId,
        }),
      );

      await commandBus.execute(
        new CreateCompanyCommand({
          name: 'Finance Corp',
          description: null,
          website: null,
          logoUrl: null,
          industry: 'Finance',
          size: null,
          location: null,
          position: null,
          createdBy: hrId,
        }),
      );

      // Act
      const query = new ListCompaniesQuery({
        page: 1,
        limit: 10,
        isActive: undefined,
        search: undefined,
        createdBy: undefined,
        currentUserId: hrId,
        isAdmin: false,
      });
      const result = await queryBus.execute(query);

      // Assert - Should return all HR's companies
      expect(result.data.length).toBe(3);
      expect(result.total).toBe(3);
    });

    it('should return all companies for HR user (no pagination in MVP)', async () => {
      // Arrange - Create multiple companies
      const hrId = await seedUser(dataSource, {
        email: 'hr@test.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: 'hr',
      });

      // Create 5 companies
      for (let i = 1; i <= 5; i++) {
        await commandBus.execute(
          new CreateCompanyCommand({
            name: `Company ${i}`,
            description: null,
            website: null,
            logoUrl: null,
            industry: null,
            size: null,
            location: null,
            position: null,
            createdBy: hrId,
          }),
        );
      }

      // Act
      const query = new ListCompaniesQuery({
        page: 1,
        limit: 10,
        isActive: undefined,
        search: undefined,
        createdBy: undefined,
        currentUserId: hrId,
        isAdmin: false,
      });
      const result = await queryBus.execute(query);

      // Assert - Returns all companies (pagination not implemented for HR in MVP)
      expect(result.data.length).toBe(5);
      expect(result.total).toBe(5);
    });

    it('should return empty array for user without companies', async () => {
      // Arrange - HR user without companies
      const hrId = await seedUser(dataSource, {
        email: 'hr@test.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: 'hr',
      });

      // Act
      const query = new ListCompaniesQuery({
        page: 1,
        limit: 10,
        isActive: undefined,
        search: undefined,
        createdBy: undefined,
        currentUserId: hrId,
        isAdmin: false,
      });
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return company with metadata', async () => {
      // Arrange
      const hrId = await seedUser(dataSource, {
        email: 'hr@test.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: 'hr',
      });

      await commandBus.execute(
        new CreateCompanyCommand({
          name: 'Tech Solutions Inc',
          description: 'Software development company',
          website: 'https://techsolutions.com',
          logoUrl: null,
          industry: 'Technology',
          size: '51-200',
          location: 'San Francisco, CA',
          position: 'CTO',
          createdBy: hrId,
        }),
      );

      // Act
      const query = new ListCompaniesQuery({
        page: 1,
        limit: 10,
        isActive: undefined,
        search: undefined,
        createdBy: undefined,
        currentUserId: hrId,
        isAdmin: false,
      });
      const result = await queryBus.execute(query);

      // Assert - Verify full metadata
      expect(result.data.length).toBe(1);
      const company = result.data[0];
      expect(company.name).toBe('Tech Solutions Inc');
      expect(company.description).toBe('Software development company');
      expect(company.website).toBe('https://techsolutions.com');
      expect(company.industry).toBe('Technology');
      expect(company.size).toBe('51-200');
      expect(company.location).toBe('San Francisco, CA');
      expect(company.createdAt).toBeDefined();
      expect(company.updatedAt).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should return empty array for non-existent user', async () => {
      // Arrange
      const nonExistentUserId = uuidv4();

      // Act
      const query = new ListCompaniesQuery({
        page: 1,
        limit: 10,
        isActive: undefined,
        search: undefined,
        createdBy: undefined,
        currentUserId: nonExistentUserId,
        isAdmin: false,
      });
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
