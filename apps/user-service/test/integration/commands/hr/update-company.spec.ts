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
import { UpdateCompanyCommand } from '../../../../src/application/commands/hr/update-company/update-company.command';

describe('UpdateCompanyCommand Integration', () => {
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
    it('should update company name', async () => {
      // Arrange - Create company
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@company.com',
        firstName: 'HR',
        lastName: 'User',
        role: 'hr',
      });

      const createCommand = new CreateCompanyCommand(
        'Old Name',
        'Description',
        null,
        null,
        null,
        null,
        null,
        null,
        hrUserId,
      );
      const { companyId } = await commandBus.execute(createCommand);

      // Act - Update name
      const updateCommand = new UpdateCompanyCommand(
        companyId,
        'New Name',
        'Description',
        null,
        null,
        null,
        null,
        null,
        hrUserId,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const companies = await dataSource.query(
        'SELECT * FROM companies WHERE id = $1',
        [companyId],
      );

      expect(companies.length).toBe(1);
      expect(companies[0].name).toBe('New Name');
    });

    it('should update description', async () => {
      // Arrange
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@test.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'hr',
      });

      const createCommand = new CreateCompanyCommand(
        'Test Company',
        'Old description',
        null,
        null,
        null,
        null,
        null,
        null,
        hrUserId,
      );
      const { companyId } = await commandBus.execute(createCommand);

      // Act
      const updateCommand = new UpdateCompanyCommand(
        companyId,
        'Test Company',
        'New description',
        null,
        null,
        null,
        null,
        null,
        hrUserId,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const companies = await dataSource.query(
        'SELECT description FROM companies WHERE id = $1',
        [companyId],
      );

      expect(companies[0].description).toBe('New description');
    });

    it('should update website and logo', async () => {
      // Arrange
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@test.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'hr',
      });

      const createCommand = new CreateCompanyCommand(
        'Test Company',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        hrUserId,
      );
      const { companyId } = await commandBus.execute(createCommand);

      // Act - Add website and logo
      const updateCommand = new UpdateCompanyCommand(
        companyId,
        'Test Company',
        null,
        'https://newsite.com',
        'https://newsite.com/logo.png',
        null,
        null,
        null,
        hrUserId,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const companies = await dataSource.query(
        'SELECT website, logo_url FROM companies WHERE id = $1',
        [companyId],
      );

      expect(companies[0].website).toBe('https://newsite.com');
      expect(companies[0].logo_url).toBe('https://newsite.com/logo.png');
    });

    it('should update industry, size, and location', async () => {
      // Arrange
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@test.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'hr',
      });

      const createCommand = new CreateCompanyCommand(
        'Test Company',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        hrUserId,
      );
      const { companyId } = await commandBus.execute(createCommand);

      // Act
      const updateCommand = new UpdateCompanyCommand(
        companyId,
        'Test Company',
        null,
        null,
        null,
        'Technology',
        '51-200',
        'New York, NY',
        hrUserId,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const companies = await dataSource.query(
        'SELECT industry, size, location FROM companies WHERE id = $1',
        [companyId],
      );

      expect(companies[0].industry).toBe('Technology');
      expect(companies[0].size).toBe('51-200');
      expect(companies[0].location).toBe('New York, NY');
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@test.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'hr',
      });

      const createCommand = new CreateCompanyCommand(
        'Old Company',
        'Old desc',
        'https://old.com',
        null,
        'Old Industry',
        '1-10',
        'Old Location',
        null,
        hrUserId,
      );
      const { companyId } = await commandBus.execute(createCommand);

      // Act - Update everything
      const updateCommand = new UpdateCompanyCommand(
        companyId,
        'New Company',
        'New description',
        'https://new.com',
        'https://new.com/logo.png',
        'New Industry',
        '200+',
        'New Location',
        hrUserId,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const companies = await dataSource.query(
        'SELECT * FROM companies WHERE id = $1',
        [companyId],
      );

      expect(companies[0].name).toBe('New Company');
      expect(companies[0].description).toBe('New description');
      expect(companies[0].website).toBe('https://new.com');
      expect(companies[0].logo_url).toBe('https://new.com/logo.png');
      expect(companies[0].industry).toBe('New Industry');
      expect(companies[0].size).toBe('200+');
      expect(companies[0].location).toBe('New Location');
    });

    it('should set optional fields to null', async () => {
      // Arrange
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@test.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'hr',
      });

      const createCommand = new CreateCompanyCommand(
        'Test Company',
        'Description',
        'https://site.com',
        'https://site.com/logo.png',
        'Tech',
        '11-50',
        'SF, CA',
        null,
        hrUserId,
      );
      const { companyId } = await commandBus.execute(createCommand);

      // Act - Remove all optional fields
      const updateCommand = new UpdateCompanyCommand(
        companyId,
        'Test Company',
        null,
        null,
        null,
        null,
        null,
        null,
        hrUserId,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const companies = await dataSource.query(
        'SELECT * FROM companies WHERE id = $1',
        [companyId],
      );

      expect(companies[0].name).toBe('Test Company');
      expect(companies[0].description).toBeNull();
      expect(companies[0].website).toBeNull();
      expect(companies[0].logo_url).toBeNull();
      expect(companies[0].industry).toBeNull();
      expect(companies[0].size).toBeNull();
      expect(companies[0].location).toBeNull();
    });
  });

  describe('Error Cases', () => {
    it('should throw error when company not found', async () => {
      // Arrange
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@test.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'hr',
      });

      const nonExistentId = uuidv4();
      const updateCommand = new UpdateCompanyCommand(
        nonExistentId,
        'New Name',
        null,
        null,
        null,
        null,
        null,
        null,
        hrUserId,
      );

      // Act & Assert
      await expect(commandBus.execute(updateCommand)).rejects.toThrow();
    });

    it('should throw error when user is not company member', async () => {
      // Arrange - HR1 creates company
      const hr1UserId = await seedUser(dataSource, {
        email: 'hr1@test.com',
        firstName: 'HR1',
        lastName: 'User',
        role: 'hr',
      });

      const createCommand = new CreateCompanyCommand(
        'Test Company',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        hr1UserId,
      );
      const { companyId } = await commandBus.execute(createCommand);

      // Arrange - HR2 tries to update
      const hr2UserId = await seedUser(dataSource, {
        email: 'hr2@test.com',
        firstName: 'HR2',
        lastName: 'User',
        role: 'hr',
      });

      const updateCommand = new UpdateCompanyCommand(
        companyId,
        'Updated Name',
        null,
        null,
        null,
        null,
        null,
        null,
        hr2UserId,
      );

      // Act & Assert - HR2 is not a member, should fail
      await expect(commandBus.execute(updateCommand)).rejects.toThrow();
    });
  });
});
