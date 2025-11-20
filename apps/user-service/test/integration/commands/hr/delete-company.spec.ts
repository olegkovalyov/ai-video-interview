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
import { DeleteCompanyCommand } from '../../../../src/application/commands/hr/delete-company/delete-company.command';

describe('DeleteCompanyCommand Integration', () => {
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
    it('should delete existing company', async () => {
      // Arrange - Create company
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@company.com',
        firstName: 'HR',
        lastName: 'User',
        role: 'hr',
      });

      const createCommand = new CreateCompanyCommand(
        'Test Company',
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

      // Verify company exists
      const beforeDelete = await dataSource.query(
        'SELECT * FROM companies WHERE id = $1',
        [companyId],
      );
      expect(beforeDelete.length).toBe(1);

      // Act - Delete company
      const deleteCommand = new DeleteCompanyCommand(companyId, hrUserId);
      await commandBus.execute(deleteCommand);

      // Assert - Company removed
      const afterDelete = await dataSource.query(
        'SELECT * FROM companies WHERE id = $1',
        [companyId],
      );
      expect(afterDelete.length).toBe(0);
    });

    it('should delete company with user_companies cascade', async () => {
      // Arrange - Create company
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@company.com',
        firstName: 'HR',
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
        'CEO',
        hrUserId,
      );
      const { companyId } = await commandBus.execute(createCommand);

      // Verify user_companies association exists
      const beforeDelete = await dataSource.query(
        'SELECT * FROM user_companies WHERE company_id = $1',
        [companyId],
      );
      expect(beforeDelete.length).toBe(1);
      expect(beforeDelete[0].user_id).toBe(hrUserId);

      // Act - Delete company
      const deleteCommand = new DeleteCompanyCommand(companyId, hrUserId);
      await commandBus.execute(deleteCommand);

      // Assert - Company removed
      const companiesAfterDelete = await dataSource.query(
        'SELECT * FROM companies WHERE id = $1',
        [companyId],
      );
      expect(companiesAfterDelete.length).toBe(0);

      // Assert - UserCompanies also removed (cascade)
      const userCompaniesAfterDelete = await dataSource.query(
        'SELECT * FROM user_companies WHERE company_id = $1',
        [companyId],
      );
      expect(userCompaniesAfterDelete.length).toBe(0);
    });

    it('should delete multiple companies by creator', async () => {
      // Arrange - HR creates 3 companies
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@entrepreneur.com',
        firstName: 'Serial',
        lastName: 'Entrepreneur',
        role: 'hr',
      });

      const command1 = new CreateCompanyCommand('Company 1', null, null, null, null, null, null, null, hrUserId);
      const { companyId: id1 } = await commandBus.execute(command1);

      const command2 = new CreateCompanyCommand('Company 2', null, null, null, null, null, null, null, hrUserId);
      const { companyId: id2 } = await commandBus.execute(command2);

      const command3 = new CreateCompanyCommand('Company 3', null, null, null, null, null, null, null, hrUserId);
      const { companyId: id3 } = await commandBus.execute(command3);

      // Act - Delete all 3
      await commandBus.execute(new DeleteCompanyCommand(id1, hrUserId));
      await commandBus.execute(new DeleteCompanyCommand(id2, hrUserId));
      await commandBus.execute(new DeleteCompanyCommand(id3, hrUserId));

      // Assert - All removed
      const remaining = await dataSource.query(
        'SELECT * FROM companies WHERE id = ANY($1)',
        [[id1, id2, id3]],
      );
      expect(remaining.length).toBe(0);
    });

    it('should delete company with full data', async () => {
      // Arrange - Create company with all fields populated
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@test.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'hr',
      });

      const createCommand = new CreateCompanyCommand(
        'Full Company',
        'Description',
        'https://company.com',
        'https://company.com/logo.png',
        'Technology',
        '51-200',
        'San Francisco, CA',
        'CTO',
        hrUserId,
      );
      const { companyId } = await commandBus.execute(createCommand);

      // Act - Delete
      const deleteCommand = new DeleteCompanyCommand(companyId, hrUserId);
      await commandBus.execute(deleteCommand);

      // Assert - Removed
      const afterDelete = await dataSource.query(
        'SELECT * FROM companies WHERE id = $1',
        [companyId],
      );
      expect(afterDelete.length).toBe(0);
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
      const deleteCommand = new DeleteCompanyCommand(nonExistentId, hrUserId);

      // Act & Assert
      await expect(commandBus.execute(deleteCommand)).rejects.toThrow();
    });

    it('should throw error when user is not creator', async () => {
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

      // Arrange - HR2 tries to delete
      const hr2UserId = await seedUser(dataSource, {
        email: 'hr2@test.com',
        firstName: 'HR2',
        lastName: 'User',
        role: 'hr',
      });

      const deleteCommand = new DeleteCompanyCommand(companyId, hr2UserId);

      // Act & Assert - HR2 is not creator, should fail
      await expect(commandBus.execute(deleteCommand)).rejects.toThrow();
    });

    it('should throw error when deleting already deleted company', async () => {
      // Arrange - Create and delete company
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

      const deleteCommand = new DeleteCompanyCommand(companyId, hrUserId);
      await commandBus.execute(deleteCommand);

      // Act - Try to delete again
      const deleteAgainCommand = new DeleteCompanyCommand(companyId, hrUserId);

      // Assert
      await expect(commandBus.execute(deleteAgainCommand)).rejects.toThrow();
    });
  });
});
