import { INestApplication } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
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

      await dataSource.query(
        'INSERT INTO hr_profiles (user_id) VALUES ($1)',
        [hrId],
      );

      // Create 3 companies
      await commandBus.execute(new CreateCompanyCommand(
        'Tech Corp',
        'Leading tech company',
        'https://techcorp.com',
        null,
        'Technology',
        '51-200',
        'San Francisco, CA',
        null,
        hrId,
      ));

      await commandBus.execute(new CreateCompanyCommand(
        'Finance Inc',
        'Financial services',
        'https://finance.com',
        null,
        'Finance',
        '200+',
        'New York, NY',
        null,
        hrId,
      ));

      await commandBus.execute(new CreateCompanyCommand(
        'Health Plus',
        'Healthcare provider',
        'https://health.com',
        null,
        'Healthcare',
        '11-50',
        'Boston, MA',
        null,
        hrId,
      ));

      // Act
      const query = new ListCompaniesQuery(1, 10, undefined, undefined, undefined, hrId, false);
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

      await dataSource.query(
        'INSERT INTO hr_profiles (user_id) VALUES ($1)',
        [hrId],
      );

      // Create companies
      await commandBus.execute(new CreateCompanyCommand(
        'Tech Corp 1',
        null,
        null,
        null,
        'Technology',
        null,
        null,
        null,
        hrId,
      ));

      await commandBus.execute(new CreateCompanyCommand(
        'Tech Corp 2',
        null,
        null,
        null,
        'Technology',
        null,
        null,
        null,
        hrId,
      ));

      await commandBus.execute(new CreateCompanyCommand(
        'Finance Corp',
        null,
        null,
        null,
        'Finance',
        null,
        null,
        null,
        hrId,
      ));

      // Act
      const query = new ListCompaniesQuery(1, 10, undefined, undefined, undefined, hrId, false);
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

      await dataSource.query(
        'INSERT INTO hr_profiles (user_id) VALUES ($1)',
        [hrId],
      );

      // Create 5 companies
      for (let i = 1; i <= 5; i++) {
        await commandBus.execute(new CreateCompanyCommand(
          `Company ${i}`,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          hrId,
        ));
      }

      // Act
      const query = new ListCompaniesQuery(1, 10, undefined, undefined, undefined, hrId, false);
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

      await dataSource.query(
        'INSERT INTO hr_profiles (user_id) VALUES ($1)',
        [hrId],
      );

      // Act
      const query = new ListCompaniesQuery(1, 10, undefined, undefined, undefined, hrId, false);
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

      await dataSource.query(
        'INSERT INTO hr_profiles (user_id) VALUES ($1)',
        [hrId],
      );

      await commandBus.execute(new CreateCompanyCommand(
        'Tech Solutions Inc',
        'Software development company',
        'https://techsolutions.com',
        null,
        'Technology',
        '51-200',
        'San Francisco, CA',
        'CTO',
        hrId,
      ));

      // Act
      const query = new ListCompaniesQuery(1, 10, undefined, undefined, undefined, hrId, false);
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
      const query = new ListCompaniesQuery(1, 10, undefined, undefined, undefined, nonExistentUserId, false);
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
