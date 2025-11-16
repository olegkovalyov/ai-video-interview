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
import { GetCompanyQuery } from '../../../../src/application/queries/companies/get-company.query';

describe('GetCompanyQuery Integration', () => {
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
    it('should get company by ID', async () => {
      // Arrange - Create HR user and company
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

      const createCommand = new CreateCompanyCommand(
        'Tech Corp',
        'Leading tech company',
        'https://techcorp.com',
        null,
        'Technology',
        '51-200',
        'San Francisco, CA',
        'CTO',
        hrId,
      );

      const { companyId } = await commandBus.execute(createCommand);

      // Act
      const query = new GetCompanyQuery(companyId);
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(companyId);
      expect(result.name).toBe('Tech Corp');
      expect(result.description).toBe('Leading tech company');
      expect(result.website).toBe('https://techcorp.com');
      expect(result.industry).toBe('Technology');
      expect(result.size).toBe('51-200');
      expect(result.location).toBe('San Francisco, CA');
    });

    it('should get company with all metadata', async () => {
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

      const createCommand = new CreateCompanyCommand(
        'Complete Company',
        'Full description here',
        'https://complete.com',
        'https://complete.com/logo.png',
        'Healthcare',
        '200+',
        'Boston, MA',
        'CEO',
        hrId,
      );

      const { companyId } = await commandBus.execute(createCommand);

      // Act
      const query = new GetCompanyQuery(companyId);
      const result = await queryBus.execute(query);

      // Assert - Verify all fields
      expect(result.id).toBe(companyId);
      expect(result.name).toBe('Complete Company');
      expect(result.description).toBe('Full description here');
      expect(result.website).toBe('https://complete.com');
      expect(result.logoUrl).toBe('https://complete.com/logo.png');
      expect(result.industry).toBe('Healthcare');
      expect(result.size).toBe('200+');
      expect(result.location).toBe('Boston, MA');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should get company with null optional fields', async () => {
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

      const createCommand = new CreateCompanyCommand(
        'Minimal Company',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        hrId,
      );

      const { companyId } = await commandBus.execute(createCommand);

      // Act
      const query = new GetCompanyQuery(companyId);
      const result = await queryBus.execute(query);

      // Assert - Optional fields should be null
      expect(result.id).toBe(companyId);
      expect(result.name).toBe('Minimal Company');
      expect(result.description).toBeNull();
      expect(result.website).toBeNull();
      expect(result.logoUrl).toBeNull();
      expect(result.industry).toBeNull();
      expect(result.size).toBeNull();
      expect(result.location).toBeNull();
    });

    it('should get company created by current HR', async () => {
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

      const createCommand = new CreateCompanyCommand(
        'My Company',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        hrId,
      );

      const { companyId } = await commandBus.execute(createCommand);

      // Verify user has access through user_companies
      const userCompanies = await dataSource.query(
        'SELECT * FROM user_companies WHERE user_id = $1 AND company_id = $2',
        [hrId, companyId],
      );

      expect(userCompanies.length).toBe(1);

      // Act
      const query = new GetCompanyQuery(companyId);
      const result = await queryBus.execute(query);

      // Assert
      expect(result.id).toBe(companyId);
      expect(result.name).toBe('My Company');
    });
  });

  describe('Error Cases', () => {
    it('should throw error when company not found', async () => {
      // Arrange
      const nonExistentId = uuidv4();

      // Act
      const query = new GetCompanyQuery(nonExistentId);

      // Assert
      await expect(queryBus.execute(query)).rejects.toThrow('not found');
    });

  });
});
