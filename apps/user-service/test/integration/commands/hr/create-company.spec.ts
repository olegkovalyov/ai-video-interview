import { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedUser,
} from '../../setup';
import { CreateCompanyCommand } from '../../../../src/application/commands/hr/create-company/create-company.command';

describe('CreateCompanyCommand Integration', () => {
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
    it('should create company with full data', async () => {
      // Arrange - Create HR user
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@company.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: 'hr',
      });

      const command = new CreateCompanyCommand(
        'Tech Corp',
        'Leading technology company',
        'https://techcorp.com',
        'https://techcorp.com/logo.png',
        'Technology',
        '51-200',
        'San Francisco, CA',
        'HR Manager',
        hrUserId,
      );

      // Act
      const result = await commandBus.execute(command);

      // Assert - Command result
      expect(result.companyId).toBeDefined();
      expect(typeof result.companyId).toBe('string');

      // Assert - Company in database
      const companies = await dataSource.query(
        'SELECT * FROM companies WHERE id = $1',
        [result.companyId],
      );

      expect(companies.length).toBe(1);
      expect(companies[0].name).toBe('Tech Corp');
      expect(companies[0].description).toBe('Leading technology company');
      expect(companies[0].website).toBe('https://techcorp.com');
      expect(companies[0].logo_url).toBe('https://techcorp.com/logo.png');
      expect(companies[0].industry).toBe('Technology');
      expect(companies[0].size).toBe('51-200');
      expect(companies[0].location).toBe('San Francisco, CA');
      expect(companies[0].created_by).toBe(hrUserId);
      expect(companies[0].is_active).toBe(true);

      // Assert - UserCompany association created
      const userCompanies = await dataSource.query(
        'SELECT * FROM user_companies WHERE company_id = $1',
        [result.companyId],
      );

      expect(userCompanies.length).toBe(1);
      expect(userCompanies[0].user_id).toBe(hrUserId);
      expect(userCompanies[0].company_id).toBe(result.companyId);
      expect(userCompanies[0].position).toBe('HR Manager');
      expect(userCompanies[0].is_primary).toBe(true);
    });

    it('should create company with minimal data', async () => {
      // Arrange
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@startup.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'hr',
      });

      const command = new CreateCompanyCommand(
        'Startup Inc',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        hrUserId,
      );

      // Act
      const result = await commandBus.execute(command);

      // Assert - Company created with nulls
      const companies = await dataSource.query(
        'SELECT * FROM companies WHERE id = $1',
        [result.companyId],
      );

      expect(companies.length).toBe(1);
      expect(companies[0].name).toBe('Startup Inc');
      expect(companies[0].description).toBeNull();
      expect(companies[0].website).toBeNull();
      expect(companies[0].logo_url).toBeNull();
      expect(companies[0].industry).toBeNull();
      expect(companies[0].size).toBeNull();
      expect(companies[0].location).toBeNull();
      expect(companies[0].is_active).toBe(true);

      // Assert - UserCompany created with null position
      const userCompanies = await dataSource.query(
        'SELECT * FROM user_companies WHERE company_id = $1',
        [result.companyId],
      );

      expect(userCompanies.length).toBe(1);
      expect(userCompanies[0].position).toBeNull();
      expect(userCompanies[0].is_primary).toBe(true);
    });

    it('should create company with specific position', async () => {
      // Arrange
      const hrUserId = await seedUser(dataSource, {
        email: 'ceo@company.com',
        firstName: 'Jane',
        lastName: 'CEO',
        role: 'hr',
      });

      const command = new CreateCompanyCommand(
        'My Company',
        'Description',
        null,
        null,
        null,
        null,
        null,
        'CEO & Founder',
        hrUserId,
      );

      // Act
      const result = await commandBus.execute(command);

      // Assert - Position saved
      const userCompanies = await dataSource.query(
        'SELECT * FROM user_companies WHERE company_id = $1',
        [result.companyId],
      );

      expect(userCompanies[0].position).toBe('CEO & Founder');
    });

    it('should create multiple companies for same HR user', async () => {
      // Arrange - One HR user creates multiple companies
      const hrUserId = await seedUser(dataSource, {
        email: 'serial@entrepreneur.com',
        firstName: 'Serial',
        lastName: 'Entrepreneur',
        role: 'hr',
      });

      const command1 = new CreateCompanyCommand(
        'Company 1',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        hrUserId,
      );

      const command2 = new CreateCompanyCommand(
        'Company 2',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        hrUserId,
      );

      const command3 = new CreateCompanyCommand(
        'Company 3',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        hrUserId,
      );

      // Act
      const result1 = await commandBus.execute(command1);
      const result2 = await commandBus.execute(command2);
      const result3 = await commandBus.execute(command3);

      // Assert - All 3 companies created
      const companies = await dataSource.query(
        'SELECT * FROM companies WHERE id = ANY($1) ORDER BY name',
        [[result1.companyId, result2.companyId, result3.companyId]],
      );

      expect(companies.length).toBe(3);
      expect(companies[0].name).toBe('Company 1');
      expect(companies[1].name).toBe('Company 2');
      expect(companies[2].name).toBe('Company 3');

      // Assert - 3 user_companies associations
      const userCompanies = await dataSource.query(
        'SELECT * FROM user_companies WHERE user_id = $1',
        [hrUserId],
      );

      expect(userCompanies.length).toBe(3);
      // All should be primary since they are the only member
      userCompanies.forEach((uc: any) => {
        expect(uc.is_primary).toBe(true);
      });
    });

    it('should create company with different sizes', async () => {
      // Arrange
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@test.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'hr',
      });

      const sizes = ['1-10', '11-50', '51-200', '200+'];

      // Act & Assert - Create company for each size
      for (const size of sizes) {
        const command = new CreateCompanyCommand(
          `Company ${size}`,
          null,
          null,
          null,
          null,
          size,
          null,
          null,
          hrUserId,
        );

        const result = await commandBus.execute(command);

        const companies = await dataSource.query(
          'SELECT size FROM companies WHERE id = $1',
          [result.companyId],
        );

        expect(companies[0].size).toBe(size);
      }
    });
  });

  describe('Error Cases', () => {
    it('should throw error when user not found', async () => {
      // Arrange
      const nonExistentUserId = uuidv4();
      const command = new CreateCompanyCommand(
        'Test Company',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        nonExistentUserId,
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    // Note: Role validation (HR-only) is handled at API/Guard level, not in Handler
    // Handlers focus on business logic, not authorization
  });
});
